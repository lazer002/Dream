import * as React from "react"

export const Table = ({ children, className, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      className={`w-full caption-bottom text-sm ${className || ""}`}
      {...props}
    >
      {children}
    </table>
  </div>
)

export const TableHeader = ({ children, className, ...props }) => (
  <thead
    className={`[&_tr]:border-b ${className || ""}`}
    {...props}
  >
    {children}
  </thead>
)

export const TableBody = ({ children, className, ...props }) => (
  <tbody
    className={`[&_tr:last-child]:border-0 ${className || ""}`}
    {...props}
  >
    {children}
  </tbody>
)

export const TableRow = ({ children, className, ...props }) => (
  <tr
    className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ""}`}
    {...props}
  >
    {children}
  </tr>
)

export const TableHead = ({ children, className, ...props }) => (
  <th
    className={`h-10 px-2 text-left align-middle font-medium text-muted-foreground ${className || ""}`}
    {...props}
  >
    {children}
  </th>
)

export const TableCell = ({ children, className, ...props }) => (
  <td
    className={`p-2 align-middle ${className || ""}`}
    {...props}
  >
    {children}
  </td>
)

export const TableCaption = ({ children, className, ...props }) => (
  <caption
    className={`mt-4 text-sm text-muted-foreground ${className || ""}`}
    {...props}
  >
    {children}
  </caption>
)
