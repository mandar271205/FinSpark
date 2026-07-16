export function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString() : value
}

export function toCsv(rows, columns) {
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return ''
    const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  return [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => columns.map((col) => escapeCsv(row[col])).join(',')),
  ].join('\n')
}

export function formatCell(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(4)
  if (value === null || value === undefined) return '-'
  return String(value)
}
