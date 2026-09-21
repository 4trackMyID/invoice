/**
 * Unit checks for the storage CRUD layer, run in Node with a localStorage stub
 * (no browser needed):
 *
 *   node scripts/unit-storage.mjs
 */
const store = new Map()
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
}

const { localStorageStore } = await import('../src/lib/storage.js')
const { emptyInvoice, fromPayload, toPayload } = await import('../src/lib/invoice.js')

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const makeInvoice = (overrides = {}) => {
  const base = emptyInvoice()
  base.company.name = 'Haputra Studio'
  base.customer.name = 'Railz Pty Ltd'
  base.meta.invoice_number = ''
  base.line_items = [{ name: 'Audit milestone 1', milestone: 'Termin 1 / 30%', quantity: '1', rate: '7500', tax: '11' }]
  return { ...base, ...overrides }
}

// CREATE
const created = await localStorageStore.create(makeInvoice())
check('create returns an id', Boolean(created?.id), created?.id)
check('create assigns the first number of the year', created.invoice_number === `INV/${new Date().getFullYear()}/001`, created.invoice_number)
check('create keeps the line items', created.line_count === 1, `${created.line_count}`)
check('create computes the total with tax', created.total === 8325, `${created.total}`)

// READ
const list1 = await localStorageStore.list()
check('list returns the record', list1.length === 1, `${list1.length}`)
const one = await localStorageStore.get(created.id)
check('get returns the payload', Boolean(one?.payload?.line_items?.length), 'payload present')

// UPDATE
await localStorageStore.update(created.id, makeInvoice({ customer: { name: 'Railz Fleet Pty Ltd' } }))
const afterUpdate = await localStorageStore.list()
const updated = await localStorageStore.get(created.id)
check('update does not add a record', afterUpdate.length === 1, `${afterUpdate.length}`)
check('update persists the change', updated.customer_name === 'Railz Fleet Pty Ltd', updated.customer_name)
check('update keeps the original number', updated.invoice_number === created.invoice_number, updated.invoice_number)

// DUPLICATE
const copy = await localStorageStore.duplicate(created.id)
check('duplicate returns a new id', copy && copy.id !== created.id, `${copy?.id}`)
check('duplicate issues the next number', copy.invoice_number === `INV/${new Date().getFullYear()}/002`, copy.invoice_number)

// DELETE
check('delete removes the record', (await localStorageStore.remove(copy.id)) === true)
const afterDelete = await localStorageStore.list()
check('delete leaves the others', afterDelete.length === 1, `${afterDelete.length}`)
check('delete of an unknown id is a no-op', (await localStorageStore.remove('nope')) === false)

// round-trip payload fidelity
const rt = fromPayload(toPayload(makeInvoice()))
check('payload round-trips milestone', rt.line_items[0].milestone === 'Termin 1 / 30%', rt.line_items[0].milestone)
check('payload round-trips tax percent', rt.line_items[0].tax === '11', `${rt.line_items[0].tax}`)

// EXPORT / IMPORT
const backup = await localStorageStore.exportAll()
await localStorageStore.clear()
check('clear empties the list', (await localStorageStore.list()).length === 0)
const imported = await localStorageStore.importAll(backup)
check('import restores the backup', imported.imported === 1 && (await localStorageStore.list()).length === 1, JSON.stringify(imported))

// SEARCH / FILTER
await localStorageStore.update(created.id, null, { status: 'sent' })
check('status filter matches', (await localStorageStore.list({ status: 'sent' })).length === 1)
check('status filter excludes', (await localStorageStore.list({ status: 'paid' })).length === 0)
check('search matches the client', (await localStorageStore.list({ search: 'railz' })).length === 1)
check('search matches nothing for gibberish', (await localStorageStore.list({ search: 'zzz' })).length === 0)

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
