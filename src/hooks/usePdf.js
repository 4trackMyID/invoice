import { useCallback, useState } from 'react'

/**
 * Client half of the original's PDF flow: POST the invoice JSON, receive PDF
 * bytes, then either download the blob or open it for printing.
 */
export function usePdf(payload) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const request = useCallback(
    async ({ print = false } = {}) => {
      setBusy(true)
      setError('')
      try {
        const form = new FormData()
        form.append('JSONString', JSON.stringify(payload))
        form.append('is_new_template_flow', 'true')

        const res = await fetch(`/api/invoice/download?print=${print}`, { method: 'POST', body: form })
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}))
          throw new Error(detail.message || `Request failed (${res.status})`)
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        if (print) {
          window.open(url, '_blank', 'noopener')
        } else {
          const a = document.createElement('a')
          a.href = url
          a.download = `Invoice-${payload.invoice_number || 'draft'}.pdf`.replace(/[^\w.\-]+/g, '_')
          document.body.appendChild(a)
          a.click()
          a.remove()
        }
        // release the blob reference, the browser keeps the file itself
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return true
      } catch (e) {
        setError(e.message || 'Unable to build the PDF')
        return false
      } finally {
        setBusy(false)
      }
    },
    [payload],
  )

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

  return { busy, error, download: () => request({ print: false }), print: () => request({ print: true }), save }
}
