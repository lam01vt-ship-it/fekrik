import { useEffect, useState } from 'react'
import { formatMoneyEn, parseMoneyEn, sanitizeMoneyInputString } from '../utils/moneyFormat'

type Props = {
  value: number
  syncKey: string | number
  maxFractionDigits: 0 | 2
  onCommit: (n: number) => void
  className?: string
  readOnly?: boolean
}

export function MoneyCellInput({
  value,
  syncKey,
  maxFractionDigits,
  onCommit,
  className = 'krik-input krik-cell-input krik-money-input',
  readOnly = false,
}: Props) {
  const [text, setText] = useState(() => formatMoneyEn(value, maxFractionDigits))

  useEffect(() => {
    setText(formatMoneyEn(value, maxFractionDigits))
  }, [value, maxFractionDigits, syncKey])

  return (
    <input
      className={className}
      readOnly={readOnly}
      inputMode={maxFractionDigits === 0 ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        if (readOnly) return
        setText(sanitizeMoneyInputString(e.target.value, maxFractionDigits))
      }}
      onBlur={() => {
        if (readOnly) return
        const raw = text.trim() === '' || text.trim() === '.' ? '0' : text
        const n =
          maxFractionDigits === 0
            ? Math.round(parseMoneyEn(raw))
            : Math.round(parseMoneyEn(raw) * 100) / 100
        const clamped = n < 0 ? 0 : n
        setText(formatMoneyEn(clamped, maxFractionDigits))
        const prev =
          maxFractionDigits === 0
            ? Math.round(value)
            : Math.round(value * 100) / 100
        if (clamped !== prev) onCommit(clamped)
      }}
    />
  )
}
