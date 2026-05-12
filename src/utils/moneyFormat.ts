/** Định dạng kiểu 123,456.12 — nhóm nghìn bằng dấu phẩy, thập phân bằng chấm (en-US). */
export function formatMoneyEn(value: number, maxFractionDigits: 0 | 1 | 2 = 2): string {
  if (!Number.isFinite(value)) return ''
  const rounded =
    maxFractionDigits === 0
      ? Math.round(value)
      : maxFractionDigits === 1
        ? Math.round(value * 10) / 10
        : Math.round(value * 100) / 100
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
    useGrouping: true,
  }).format(rounded)
}

export function parseMoneyEn(raw: string): number {
  const t = raw.replace(/,/g, '').trim()
  if (t === '' || t === '.') return 0
  const x = parseFloat(t)
  return Number.isFinite(x) ? x : 0
}

/**
 * Chuỗi đang gõ: chỉ giữ chữ số và tối đa một dấu chấm; phần thập phân giới hạn độ dài.
 * Trả về chuỗi đã thêm dấu phẩy nhóm nghìn (có thể rỗng khi xoá hết).
 */
export function sanitizeMoneyInputString(raw: string, maxFractionDigits: 0 | 2): string {
  const flat = raw.replace(/,/g, '')
  let acc = ''
  let dot = false
  for (const c of flat) {
    if (c >= '0' && c <= '9') acc += c
    else if (c === '.' && maxFractionDigits > 0 && !dot) {
      dot = true
      acc += '.'
    }
  }
  if (acc === '' || acc === '.') return acc === '.' ? '0.' : ''

  const parts = acc.split('.')
  let intRaw = parts[0] ?? ''
  let dec = parts.length > 1 ? parts.slice(1).join('') : ''
  if (maxFractionDigits > 0) dec = dec.slice(0, maxFractionDigits)
  else dec = ''

  intRaw = intRaw.replace(/^0+(?=\d)/, '') || '0'
  const intFmt = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (dot && maxFractionDigits > 0) return `${intFmt}.${dec}`
  return intFmt
}
