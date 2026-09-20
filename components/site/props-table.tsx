export interface PropRow {
  name: string
  type: string
  /** Shown as "—" when the prop has no default. */
  default?: string
  description: string
  required?: boolean
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">Props</caption>
        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Prop
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Type
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Default
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.name} className="align-top">
              <th scope="row" className="px-3 py-2 font-mono text-xs font-medium whitespace-nowrap">
                {row.name}
                {row.required && <span className="text-destructive">*</span>}
              </th>
              <td className="px-3 py-2 font-mono text-xs">{row.type}</td>
              <td className="px-3 py-2 font-mono text-xs">{row.default ?? "—"}</td>
              <td className="text-muted-foreground px-3 py-2">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
