import { useCallback, useEffect, useState } from 'react'
import { localStorageStore } from '../lib/storage.js'

/**
 * CRUD over the stored invoice records. The store is swappable (see
 * src/lib/storage.js) — swapping it for a remote SQL backend needs no change here.
 */
export function useInvoices() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await localStorageStore.list({ search, status }))
      setError('')
    } catch (e) {
      setError(e.message || 'Unable to read stored invoices')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(
    async (invoice, name) => {
      const created = await localStorageStore.create(invoice, name)
      await refresh()
      return created
    },
    [refresh],
  )

  const get = useCallback((id) => localStorageStore.get(id), [])

  const update = useCallback(
    async (id, invoice, patch) => {
      const updated = await localStorageStore.update(id, invoice, patch)
      await refresh()
      return updated
    },
    [refresh],
  )

  const duplicate = useCallback(
    async (id) => {
      const copy = await localStorageStore.duplicate(id)
      await refresh()
      return copy
    },
    [refresh],
  )

  const remove = useCallback(
    async (id) => {
      const ok = await localStorageStore.remove(id)
      await refresh()
      return ok
    },
    [refresh],
  )

  const exportAll = useCallback(() => localStorageStore.exportAll(), [])
  const importAll = useCallback(
    async (payload) => {
      const result = await localStorageStore.importAll(payload)
      await refresh()
      return result
    },
    [refresh],
  )
  const clearAll = useCallback(async () => {
    await localStorageStore.clear()
    await refresh()
  }, [refresh])

  return {
    records, loading, error, search, setSearch, status, setStatus,
    refresh, create, get, update, duplicate, remove, exportAll, importAll, clearAll,
    backend: localStorageStore.backend,
  }
}
