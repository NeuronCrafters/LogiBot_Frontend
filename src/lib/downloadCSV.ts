export function downloadCSV<T extends Record<string, string | number | boolean | null | undefined>>(
  filename: string,
  rows: T[]
): void {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(field => {
        const value = row[field];
        return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(",")
    )
  ];

  const blob = new Blob([csvContent.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
