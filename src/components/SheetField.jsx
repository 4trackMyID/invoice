import { createContext, useContext } from 'react'
import { formatDate } from '../lib/format.js'

/**
 * Editable fields that look like printed invoice text until hovered/focused.
 *
 * Printing swaps each control for a static element that keeps the *same* class
 * list and box, because a form control prints its own chrome: a date field keeps
 * its picker icon, a textarea clips at its row count, an empty field prints its
 * placeholder. Only the element changes — `sheet-input` (transparent border,
 * inherited font, width) plus `inline-block`/`block` to reproduce the control's
 * box, so the printed sheet and the screen sheet lay out identically.
 *
 * The PDF export renders these same components with the provider on, which is
 * what makes the export *be* the sheet instead of a second interpretation of it.
 */
const PrintMode = createContext(false)

export function PrintModeProvider({ children }) {
  return <PrintMode.Provider value={true}>{children}</PrintMode.Provider>
}

export const usePrintMode = () => useContext(PrintMode)

export function SheetInput({ value, onChange, className = '', error, ...rest }) {
  const print = usePrintMode()
  // `inline-block` matters: `.sheet-input` carries width:100%, which an inline
  // span ignores — and `.num-input`'s text-align needs a block container
  if (print) return <span className={`sheet-input inline-block ${className}`}>{value ?? ''}</span>
  return (
    <input
      {...rest}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`sheet-input ${error ? 'is-error' : ''} ${className}`}
    />
  )
}

export function SheetTextarea({ value, onChange, className = '', ...rest }) {
  const print = usePrintMode()
  // keeping `.sheet-textarea` itself is the point: its min-height and line-height
  // are the box the control occupies on screen, so the document does not shift.
  // A div prints the whole note where a textarea prints clipped at its rows.
  if (print) {
    return <div className={`sheet-input sheet-textarea block whitespace-pre-wrap ${className}`}>{value ?? ''}</div>
  }
  return (
    <textarea
      {...rest}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`sheet-input sheet-textarea ${className}`}
    />
  )
}

/** A date field: the native picker on screen, dd/mm/yyyy on the document. */
export function SheetDate({ value, onChange, className = '', ...rest }) {
  const print = usePrintMode()
  if (print) return <span className={`sheet-input inline-block ${className}`}>{formatDate(value)}</span>
  return (
    <input
      {...rest}
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`sheet-input ${className}`}
    />
  )
}

export function Label({ children }) {
  return <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{children}</div>
}

/** Blank means "nothing a client should read": empty string, empty array, or an
 *  object whose every field is blank (e.g. an unfilled bank-details block). */
export function isBlank(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.values(value).every(isBlank)
  return false
}

/**
 * Optional sections (notes, terms, payment details, project). On screen the
 * heading is the affordance that tells the user the field exists; on a document
 * a heading with nothing under it is noise, and "TERMS & CONDITIONS" followed by
 * white space reads as an unfinished invoice. So: keep the block while editing,
 * drop it entirely when printing, if its body is blank.
 */
export function OptionalBlock({ when, children }) {
  const print = usePrintMode()
  if (print && isBlank(when)) return null
  return children
}
