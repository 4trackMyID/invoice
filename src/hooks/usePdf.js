import { useCallback, useState } from 'react'

/**
 * Client half of the original's PDF flow: POST the invoice JSON, receive PDF
 * bytes, then either download the blob or open it for printing.
 */
export function usePdf(payload) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  /**
   * POST the sheet and return `{ url }` for the PDF, or `{ error }` when the
   * server refuses. The message travels in the return value, not only in
   * `error` state, so a caller that awaits it (the preview modal) can render
   * the real reason instead of a generic fallback.
   */
  const build = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.append('JSONString', JSON.stringify(payload))
      form.append('is_new_template_flow', 'true')

      const res = await fetch('/api/invoice/download?print=false', { method: 'POST', body: form })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail.message || `Request failed (${res.status})`)
      }
      const blob = await res.blob()
      return { url: URL.createObjectURL(blob) }
    } catch (e) {
      const message = e.message || 'Unable to build the PDF'
      setError(message)
      return { error: message }
    } finally {
      setBusy(false)
    }
  }, [payload])

  /**
   * Save the PDF. Resolves to the `build()` result - `{ url }` on success,
   * `{ error }` when the server refused - so a caller can show the real reason
   * instead of a silent no-op.
   */
  const download = useCallback(async () => {
    const built = await build()
    const { url } = built
    if (!url) return built
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice-${payload.invoice_number || 'draft'}.pdf`.replace(/[^\w.\-]+/g, '_')
    document.body.appendChild(a)
    a.click()
    a.remove()
    // release the blob reference; the browser keeps the file itself
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return built
  }, [build, payload])

  /**
   * Show the PDF. The tab is opened *before* the build on purpose: a
   * window.open that runs after an await is a popup as far as the browser is
   * concerned, and it gets blocked - so the button appears to do nothing.
   */
  const print = useCallback(async () => {
    const win = window.open('', '_blank')
    const built = await build()
    if (!built.url) {
      win?.close()
      return built
    }
    if (win) win.location.href = built.url
    setTimeout(() => URL.revokeObjectURL(built.url), 60_000)
    return built
  }, [build])

  const save = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.append('JSONString', JSON.stringify(payload))
      const res = await fetch('/api/invoice/save', { method: 'POST', body: form })
      const json = await res.json()
      if (json.status !== 'success') throw new Error(json.message || 'Save failed')
      return json.data.file_id
    } catch (e) {
      setError(e.message || 'Unable to save the invoice')
      return null
    } finally {
      setBusy(false)
    }
  }, [payload])

  return { busy, error, build, download, print, save }
}
