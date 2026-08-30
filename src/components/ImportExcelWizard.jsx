import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { table: 'equipment_items', label: 'ציוד', extraKey: 'quantity', extraLabel: 'כמות' },
  { table: 'shopping_items', label: 'קניות', extraKey: 'quantity', extraLabel: 'כמות' },
  { table: 'menu_items', label: 'תפריט', extraKey: 'meal_type', extraLabel: 'ארוחה' },
]

export default function ImportExcelWizard({ event, onClose, onImported }) {
  const { user } = useAuth()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [workbook, setWorkbook] = useState(null)
  const [sheetName, setSheetName] = useState(null)
  const [rows, setRows] = useState([]) // array of arrays, raw
  const [hasHeaderRow, setHasHeaderRow] = useState(true)
  const [nameCol, setNameCol] = useState('')
  const [extraCol, setExtraCol] = useState('')
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        setWorkbook(wb)
        loadSheet(wb, wb.SheetNames[0])
      } catch (err) {
        setError('לא הצלחתי לקרוא את הקובץ: ' + err.message)
      }
    }
    reader.onerror = () => setError('שגיאה בקריאת הקובץ')
    reader.readAsArrayBuffer(file)
  }

  function loadSheet(wb, name) {
    const ws = wb.Sheets[name]
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false })
    setSheetName(name)
    setRows(data)
    setNameCol('')
    setExtraCol('')
  }

  const maxCols = useMemo(() => rows.reduce((m, r) => Math.max(m, r.length), 0), [rows])
  const colLetters = useMemo(() => Array.from({ length: maxCols }, (_, i) => XLSX.utils.encode_col(i)), [maxCols])

  function colLabel(idx) {
    const headerVal = hasHeaderRow ? rows[0]?.[idx] : null
    return headerVal ? `${colLetters[idx]} — ${headerVal}` : colLetters[idx]
  }

  const dataRows = hasHeaderRow ? rows.slice(1) : rows
  const previewRows = rows.slice(0, 8)

  const parsedItems = useMemo(() => {
    if (nameCol === '') return []
    return dataRows
      .map((r) => ({
        name: (r[Number(nameCol)] ?? '').toString().trim(),
        extra: extraCol === '' ? null : (r[Number(extraCol)] ?? '').toString().trim() || null,
      }))
      .filter((item) => item.name)
  }, [dataRows, nameCol, extraCol])

  async function handleImport() {
    if (parsedItems.length === 0) return
    setImporting(true)
    setError(null)
    const toInsert = parsedItems.map((item) => {
      const row = { event_id: event.id, name: item.name, created_by: user.id }
      row[category.extraKey] = item.extra
      return row
    })
    const { error } = await supabase.from(category.table).insert(toInsert)
    setImporting(false)
    if (error) {
      setError(error.message)
    } else {
      onImported(category.table)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="row-between">
          <h2>ייבוא מ-Excel</h2>
          <button onClick={onClose} className="btn-ghost btn-sm">
            סגור ✕
          </button>
        </div>

        <p className="text-muted text-small">לאיזו רשימה מייבאים?</p>
        <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.table}
              onClick={() => setCategory(c)}
              className={category.table === c.table ? 'btn-primary' : ''}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ width: 'auto' }} />
        {fileName && <span className="text-muted text-small" style={{ marginInlineStart: 8 }}>{fileName}</span>}

        {error && <p className="text-danger text-small">{error}</p>}

        {workbook && (
          <>
            {workbook.SheetNames.length > 1 && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <label>
                  גיליון:
                  <select value={sheetName} onChange={(e) => loadSheet(workbook, e.target.value)}>
                    {workbook.SheetNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <label className="row" style={{ marginTop: 'var(--space-2)' }}>
              <input
                type="checkbox"
                checked={hasHeaderRow}
                onChange={(e) => setHasHeaderRow(e.target.checked)}
                style={{ width: 18 }}
              />
              השורה הראשונה בגיליון היא כותרות
            </label>

            <div className="grid-scroll">
              <table>
                <thead>
                  <tr>
                    {colLetters.map((letter, idx) => (
                      <th key={idx}>{colLabel(idx)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, ri) => (
                    <tr key={ri}>
                      {colLetters.map((_, ci) => (
                        <td key={ci}>{r[ci] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ marginTop: 'var(--space-3)', alignItems: 'flex-end' }}>
              <label style={{ flex: '1 1 200px' }}>
                עמודת שם הפריט (חובה)
                <select value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
                  <option value="">בחר/י עמודה</option>
                  {colLetters.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {colLabel(idx)}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ flex: '1 1 200px' }}>
                עמודת {category.extraLabel} (רשות)
                <select value={extraCol} onChange={(e) => setExtraCol(e.target.value)}>
                  <option value="">ללא</option>
                  {colLetters.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {colLabel(idx)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {nameCol !== '' && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <strong>
                  ייבוא ל{category.label}: נמצאו {parsedItems.length} פריטים
                </strong>
                {parsedItems.length > 0 && (
                  <ul className="plain text-small" style={{ maxHeight: 120, overflowY: 'auto', marginTop: 'var(--space-1)' }}>
                    {parsedItems.slice(0, 6).map((item, i) => (
                      <li key={i}>
                        {item.name}
                        {item.extra ? ` (${item.extra})` : ''}
                      </li>
                    ))}
                    {parsedItems.length > 6 && <li className="text-muted">... ועוד {parsedItems.length - 6}</li>}
                  </ul>
                )}
              </div>
            )}

            <div className="row" style={{ marginTop: 'var(--space-3)' }}>
              <button onClick={onClose}>ביטול</button>
              <button
                onClick={handleImport}
                disabled={nameCol === '' || parsedItems.length === 0 || importing}
                className="btn-primary"
              >
                {importing ? 'מייבא...' : `ייבוא (${parsedItems.length} פריטים)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
