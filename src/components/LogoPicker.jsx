import { useRef, useState } from 'react'
import { LOGO_ACCEPT, LOGO_MAX_BYTES, dataUrlBytes, fileToLogo } from '../lib/image.js'
import { usePrintMode } from './SheetField.jsx'

/**
 * Logo control for the letterhead: click or drop an image, preview it in place,
 * remove it again. Mirrors the original generator's upload affordance
 * (png/jpg/bmp, 1 MB) but shows the logo where it will actually print.
 */
export function LogoPicker({ logo, onChange, align = 'left', label = 'Company logo' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const print = usePrintMode()

  const accept = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const result = await fileToLogo(file)
      onChange(result.dataUrl)
    } catch (e) {
      setError(e.message || 'That image could not be used')
    } finally {
      setBusy(false)
    }
  }

  const kb = Math.round(dataUrlBytes(logo) / 1024)

  // The print pass renders the same wrapper without the upload controls, so the
  // logo keeps its column and only the image itself reaches the document.
  if (print) {
    return (
      <div className={`flex w-[124px] shrink-0 flex-col gap-1 ${align === 'right' ? 'items-end' : ''}`}>
        {logo ? <img src={logo} alt="Company logo" className="mx-auto max-h-[62px] w-auto object-contain" /> : null}
      </div>
    )
  }

  return (
    <div className={`no-print flex w-[124px] shrink-0 flex-col gap-1 ${align === 'right' ? 'items-end' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPT}
        className="hidden"
        aria-label={label}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          await accept(file)
        }}
      />

      {logo ? (
        <>
          <button
            type="button"
            title="Replace the logo"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={async (e) => {
              e.preventDefault()
              setDragging(false)
              await accept(e.dataTransfer.files?.[0])
            }}
            className={`group w-full rounded-md border border-dashed p-1 transition ${
              dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <img src={logo} alt="Company logo" className="mx-auto max-h-[62px] w-auto object-contain" />
          </button>
          <div className={`flex w-full items-center gap-1 text-[10px] text-slate-400 ${align === 'right' ? 'justify-end' : ''}`}>
            <button
              type="button"
              className="underline decoration-dotted hover:text-slate-600"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <span aria-hidden>·</span>
            <button
              type="button"
              className="underline decoration-dotted hover:text-rose-600"
              onClick={() => {
                setError('')
                onChange(null)
              }}
            >
              Remove
            </button>
            {kb > 0 && <span className="ml-auto">{kb} KB</span>}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={async (e) => {
            e.preventDefault()
            setDragging(false)
            await accept(e.dataTransfer.files?.[0])
          }}
          className={`w-full rounded-md border border-dashed px-2 py-3 text-center transition ${
            dragging ? 'border-sky-400 bg-sky-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <span className="block text-[11px] font-semibold text-slate-600">
            {busy ? 'Adding…' : 'Upload logo'}
          </span>
          <span className="mt-0.5 block text-[9.5px] leading-tight text-slate-400">PNG, JPG or BMP · max 1 MB</span>
        </button>
      )}

      {error ? (
        <p role="alert" className="w-full text-[10px] leading-tight text-rose-600">
          {error}
        </p>
      ) : (
        !logo && <span className="sr-only">{`Largest accepted size is ${Math.round(LOGO_MAX_BYTES / 1024 / 1024)} MB`}</span>
      )}
    </div>
  )
}
