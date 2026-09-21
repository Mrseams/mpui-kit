#!/usr/bin/env node
/**
 * Checks that registry.json is consistent with the source files, so an item
 * installed into someone else's project has everything it imports.
 *
 * For every item it verifies that:
 *  - each file exists and has a target,
 *  - each @mpkit/<name> dependency exists,
 *  - each import of another registry file (@/lib/mpkit/..., @/components/mpkit/...,
 *    @/hooks/mpkit/...) is provided by the item or one of its dependencies,
 *  - each shadcn primitive it imports (@/components/ui/<name>) is a registryDependency,
 *  - each npm package it imports is in `dependencies` (react and next excepted),
 *  - no file is imported through @/registry/... or a relative path.
 * It also checks that no two items write the same target, and that every source
 * file under registry/mpkit/ is registered (tests and the countries index excepted).
 *
 * Usage: node scripts/check-registry.mjs [path/to/registry.json]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const registryPath = process.argv[2] ?? "registry.json"
const registry = JSON.parse(readFileSync(registryPath, "utf8"))
const items = new Map(registry.items.map((item) => [item.name, item]))

const errors = []
const warnings = []
const error = (message) => errors.push(message)

// Packages every project that can use this registry already has.
const ASSUMED_PACKAGES = new Set(["react", "react-dom", "next"])
// Files that are part of the repo but deliberately not distributed.
const NOT_DISTRIBUTED = [/\.test\.tsx?$/, /countries\/index\.ts$/, /lib\/core\/index\.ts$/]

const stripExtension = (path) => path.replace(/\.(tsx?|jsx?)$/, "")

/** Names of the @mpkit items an item depends on, directly. */
function mpkitDependencies(item) {
  return (item.registryDependencies ?? [])
    .filter((name) => name.startsWith("@mpkit/"))
    .map((name) => name.slice("@mpkit/".length))
}

/** An item plus everything it pulls in, following registryDependencies. */
function closure(name, seen = new Set()) {
  if (seen.has(name)) return seen
  seen.add(name)
  const item = items.get(name)
  if (item) for (const dependency of mpkitDependencies(item)) closure(dependency, seen)
  return seen
}

function importsOf(source) {
  const found = []
  const pattern = /(?:import|export)\s(?:[^'"]*?\sfrom\s)?["']([^"']+)["']/g
  for (const match of source.matchAll(pattern)) found.push(match[1])
  return found
}

function packageName(specifier) {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

// --- Targets provided by each item, and duplicates across items
const targetOwner = new Map()
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    if (!file.target) error(`${item.name}: ${file.path} has no target`)
    if (!existsSync(file.path)) error(`${item.name}: file not found: ${file.path}`)
    const key = stripExtension(file.target ?? file.path)
    if (targetOwner.has(key) && targetOwner.get(key) !== item.name) {
      error(`${item.name} and ${targetOwner.get(key)} both write ${file.target}`)
    }
    targetOwner.set(key, item.name)
  }
}

// --- Per item checks
for (const item of registry.items) {
  const scope = [...closure(item.name)].map((name) => items.get(name)).filter(Boolean)
  const providedTargets = new Set(
    scope.flatMap((entry) => (entry.files ?? []).map((file) => stripExtension(file.target ?? "")))
  )
  const declaredPackages = new Set(scope.flatMap((entry) => entry.dependencies ?? []))
  const shadcnPrimitives = new Set(
    scope.flatMap((entry) =>
      (entry.registryDependencies ?? []).filter(
        (name) => !name.startsWith("@") && !name.includes("/")
      )
    )
  )

  for (const dependency of item.registryDependencies ?? []) {
    if (dependency.startsWith("@mpkit/") && !items.has(dependency.slice("@mpkit/".length))) {
      error(`${item.name}: depends on unknown item ${dependency}`)
    }
  }

  const imported = new Set()
  for (const file of item.files ?? []) {
    if (!existsSync(file.path)) continue
    for (const specifier of importsOf(readFileSync(file.path, "utf8"))) {
      const where = `${item.name} (${file.path})`

      if (specifier.startsWith("@/registry/")) {
        error(`${where}: imports ${specifier}; use the installed path (@/lib/mpkit/...) instead`)
      } else if (specifier.startsWith(".")) {
        error(`${where}: relative import ${specifier}; use an @/... path so the CLI can rewrite it`)
      } else if (/^@\/(lib|components|hooks)\/mpkit\//.test(specifier)) {
        const key = specifier.slice(2)
        if (!providedTargets.has(key)) {
          error(
            `${where}: imports ${specifier}, but neither this item nor its dependencies provide it`
          )
        }
        const owner = targetOwner.get(key)
        if (owner) imported.add(owner)
      } else if (specifier.startsWith("@/components/ui/")) {
        const primitive = specifier.slice("@/components/ui/".length)
        if (!shadcnPrimitives.has(primitive)) {
          error(
            `${where}: imports the shadcn ${primitive} component; add "${primitive}" to registryDependencies`
          )
        }
      } else if (specifier === "@/lib/utils") {
        // Provided by `shadcn init` in every project.
      } else if (specifier.startsWith("@/")) {
        error(`${where}: imports ${specifier}, which is not part of the registry`)
      } else {
        const name = packageName(specifier)
        if (!ASSUMED_PACKAGES.has(name) && !declaredPackages.has(name)) {
          error(`${where}: imports package ${name}; add it to "dependencies"`)
        }
      }
    }
  }

  for (const dependency of mpkitDependencies(item)) {
    if (!imported.has(dependency) && items.has(dependency)) {
      // Not an error: a dependency can be needed for types or kept for clarity.
      warnings.push(`${item.name}: no direct import from ${dependency}`)
    }
  }
}

// --- Source files that no item registers
function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}
const registered = new Set(
  registry.items.flatMap((item) =>
    (item.files ?? []).map((file) => file.path.replaceAll("\\", "/"))
  )
)
if (existsSync("registry/mpkit")) {
  for (const path of walk("registry/mpkit").map((file) =>
    relative(".", file).replaceAll("\\", "/")
  )) {
    if (NOT_DISTRIBUTED.some((pattern) => pattern.test(path))) continue
    if (!registered.has(path)) error(`${path} is not in any registry item`)
  }
}

for (const message of warnings) console.warn(`warning: ${message}`)
if (errors.length > 0) {
  for (const message of errors) console.error(`error: ${message}`)
  console.error(`\n${errors.length} problem(s) in ${registryPath}`)
  process.exit(1)
}
console.log(`registry ok: ${registry.items.length} items, ${targetOwner.size} files`)
