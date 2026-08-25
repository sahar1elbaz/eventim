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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          padding: '1.25rem',
          maxWidth: 640,
          width: '100%',
          direction: 'rtl',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>ייבוא מ-Excel</h2>
          <button onClick={onClose}>סגור ✕</button>
        </div>

        <p style={{ color: '#666', fontSize: '0.9rem' }}>לאיזו רשימה מייבאים?</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.table}
              onClick={() => setCategory(c)}
              style={{ fontWeight: category.table === c.table ? 'bold' : 'normal' }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
        {fileName && <span style={{ marginRight: '0.5rem', color: '#666' }}>{fileName}</span>}

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {workbook && (
          <>
            {workbook.SheetNames.length > 1 && (
              <div style={{ marginTop: '0.75rem' }}>
                <label>
                  גיליון:{' '}
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

            <div style={{ marginTop: '0.5rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={hasHeaderRow}
                  onChange={(e) => setHasHeaderRow(e.target.checked)}
                />{' '}
                השורה הראשונה בגיליון היא כותרות
              </label>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '0.75rem', border: '1px solid #ddd' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.8rem', width: '100%' }}>
                <thead>
                  <tr>
                    {colLetters.map((letter, idx) => (
                      <th key={idx} style={{ border: '1px solid #eee', padding: '2px 6px', background: '#f5f5f5' }}>
                        {colLabel(idx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, ri) => (
                    <tr key={ri}>
                      {colLetters.map((_, ci) => (
                        <td key={ci} style={{ border: '1px solid #eee', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {r[ci] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <label>
                עמודת שם הפריט (חובה):{' '}
                <select value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
                  <option value="">בחר/י עמודה</option>
                  {colLetters.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {colLabel(idx)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                עמודת {category.extraLabel} (רשות):{' '}
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
              <div style={{ marginTop: '0.75rem' }}>
                <strong>ייבוא ל{category.label}:</strong> נמצאו {parsedItems.length} פריטים.
                {parsedItems.length > 0 && (
                  <ul style={{ maxHeight: 120, overflowY: 'auto', fontSize: '0.85rem' }}>
                    {parsedItems.slice(0, 6).map((item, i) => (
                      <li key={i}>
                        {item.name}
                        {item.extra ? ` (${item.extra})` : ''}
                      </li>
                    ))}
                    {parsedItems.length > 6 && <li>... ועוד {parsedItems.length - 6}</li>}
                  </ul>
                )}
              </div>
            )}

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={onClose}>ביטול</button>
              <button onClick={handleImport} disabled={nameCol === '' || parsedItems.length === 0 || importing}>
                {importing ? 'מייבא...' : `ייבוא (${parsedItems.length} פריטים)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
