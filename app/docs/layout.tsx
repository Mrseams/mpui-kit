import { DocsSidebar } from "@/components/site/docs-sidebar"

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-[14rem_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <DocsSidebar />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  )
}
