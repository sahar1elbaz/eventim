import { useState } from 'react'

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const startOffset = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

/**
 * A minimal calendar range picker: click a start day, then an end day.
 * startValue/endValue are 'YYYY-MM-DD' strings (or ''); onChange receives
 * { start, end } in the same format.
 */
export default function DateRangePicker({ startValue, endValue, onChange }) {
  const initial = startValue ? new Date(startValue) : new Date()
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1))

  const cells = buildMonthGrid(viewDate)

  function cellState(d) {
    if (!d) return {}
    const iso = toISODate(d)
    const isStart = iso === startValue
    const isEnd = iso === endValue
    const inRange = startValue && endValue && iso >= startValue && iso <= endValue
    return { isStart, isEnd, inRange }
  }

  function handleClick(d) {
    if (!d) return
    const iso = toISODate(d)
    if (!startValue || (startValue && endValue) || iso < startValue) {
      onChange({ start: iso, end: '' })
    } else {
      onChange({ start: startValue, end: iso })
    }
  }

  function changeMonth(delta) {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 'var(--space-2)' }}>
        <button type="button" onClick={() => changeMonth(-1)} className="btn-ghost btn-sm">
          ‹ קודם
        </button>
        <strong>
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </strong>
        <button type="button" onClick={() => changeMonth(1)} className="btn-ghost btn-sm">
          הבא ›
        </button>
      </div>

      <div className="date-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="date-grid-header">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          const { isStart, isEnd, inRange } = cellState(d)
          return (
            <button
              type="button"
              key={i}
              disabled={!d}
              onClick={() => handleClick(d)}
              className={`date-cell${inRange ? ' in-range' : ''}${isStart || isEnd ? ' edge' : ''}`}
            >
              {d ? d.getDate() : ''}
            </button>
          )
        })}
      </div>

      <p className="text-muted text-small" style={{ marginTop: 'var(--space-2)' }}>
        {startValue
          ? `מ-${startValue}${endValue ? ` עד ${endValue}` : ' — בחר/י תאריך סיום'}`
          : 'בחר/י תאריך התחלה'}
        {startValue && (
          <button
            type="button"
            onClick={() => onChange({ start: '', end: '' })}
            className="btn-ghost btn-sm"
            style={{ marginInlineStart: 8 }}
          >
            נקה
          </button>
        )}
      </p>
    </div>
  )
}
