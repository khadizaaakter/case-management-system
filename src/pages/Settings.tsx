import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FileSpreadsheet, Pencil, ShieldPlus } from 'lucide-react'
import { useToast } from '../toast'
import {
  createLawyer,
  deleteLawyer,
  exportLawyers,
  listLawyers,
  updateLawyer,
  type LawyerPayload,
} from '../api/lawyers'
import {
  createCourt,
  deleteCourt,
  exportCourts,
  listCourts,
  updateCourt,
  type CourtPayload,
} from '../api/courts'
import {
  createCaseStatus,
  deleteCaseStatus,
  exportCaseStatuses,
  listCaseStatuses,
  updateCaseStatus,
  type CaseStatusPayload,
} from '../api/caseStatuses'
import { getErrorMessage, messageOr } from '../api/client'
import type { CaseStatus, courts as Court, Lawyer } from '../api/types'
import Modal from '../components/Modal'
import ConfirmDelete from '../components/ConfirmDelete'
import Spinner from '../components/Spinner'
import Highlight from '../components/Highlight'
import EmptyState from '../components/EmptyState'

const EMPTY_LAWYER_FORM: LawyerPayload = { name: '', phone: '', email: '', is_active: true }
const EMPTY_COURT_FORM: CourtPayload = { name: '', location: '', is_active: true }
const EMPTY_STATUS_FORM: CaseStatusPayload = { name: '', is_active: true }

/** "Export Excel" button — downloads the list as .xlsx from the backend. */
function ExportButton({ onExport, disabled }: { onExport: () => Promise<void>; disabled?: boolean }) {
  const notify = useToast()
  const [exporting, setExporting] = useState(false)

  const handleClick = async () => {
    setExporting(true)
    try {
      await onExport()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      className="btn-excel"
      title="Download this list as an Excel (.xlsx) file"
      disabled={disabled || exporting}
      onClick={handleClick}
    >
      {exporting ? (
        <Spinner size={13} />
      ) : (
        <FileSpreadsheet size={15} className="btn-excel-icon" />
      )}
      {exporting ? 'Exporting…' : 'Export Excel'}
    </button>
  )
}

function LawyerManagement() {
  const notify = useToast()

  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<LawyerPayload>(EMPTY_LAWYER_FORM)
  const [editLawyer, setEditLawyer] = useState<Lawyer | null>(null)
  const [editForm, setEditForm] = useState<LawyerPayload>(EMPTY_LAWYER_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadLawyers = () =>
    listLawyers()
      .then(setLawyers)
      .catch((err: unknown) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void loadLawyers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? lawyers.filter(
          (l) =>
            l.name?.toLowerCase().includes(q) ||
            l.phone?.toLowerCase().includes(q) ||
            l.email?.toLowerCase().includes(q),
        )
      : lawyers
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [lawyers, search])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createLawyer({
        name: createForm.name.trim(),
        phone: createForm.phone?.trim() || undefined,
        email: createForm.email?.trim() || undefined,
        is_active: createForm.is_active,
      })
      notify(messageOr(res.message, 'Lawyer added successfully!'))
      setCreateOpen(false)
      setCreateForm(EMPTY_LAWYER_FORM)
      await loadLawyers()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (lawyer: Lawyer) => {
    setEditLawyer(lawyer)
    setEditForm({
      name: lawyer.name ?? '',
      phone: lawyer.phone ?? '',
      email: lawyer.email ?? '',
      is_active: lawyer.is_active,
    })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editLawyer) return
    setSaving(true)
    try {
      const res = await updateLawyer(editLawyer.id, {
        name: editForm.name.trim(),
        phone: editForm.phone?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        is_active: editForm.is_active,
      })
      notify(messageOr(res.message, 'Lawyer updated successfully!'))
      setEditLawyer(null)
      setEditForm(EMPTY_LAWYER_FORM)
      await loadLawyers()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (lawyer: Lawyer) => {
    setDeletingId(lawyer.id)
    try {
      const res = await deleteLawyer(lawyer.id)
      notify(messageOr(res.message, 'Lawyer removed'))
      setLawyers((list) => list.filter((l) => l.id !== lawyer.id))
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="card-title">Lawyer Management ({lawyers.length})</h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-56"
            placeholder="Search lawyers…"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ExportButton onExport={exportLawyers} disabled={loading || lawyers.length === 0} />
          <button className="btn-primary" disabled={loading} onClick={() => setCreateOpen(true)}>
            <ShieldPlus size={15} /> Add Lawyer
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>
                  <div className="flex items-center justify-center gap-2 py-10 text-muted">
                    <Spinner size={17} /> Loading lawyers…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="No lawyers found" />
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((lawyer) => (
                <tr key={lawyer.id}>
                  <td className="w-24 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(lawyer)}
                      >
                        <Pencil size={13} />
                      </button>
                      <ConfirmDelete
                        title={lawyer.name}
                        busy={deletingId === lawyer.id}
                        onConfirm={() => handleDelete(lawyer)}
                      />
                    </div>
                  </td>
                  <td className="font-medium">
                    <Highlight text={lawyer.name} query={search} />
                  </td>
                  <td className="text-[12.5px] text-muted">
                    <Highlight text={lawyer.phone ?? '—'} query={search} />
                  </td>
                  <td className="text-[12.5px] text-muted">
                    <Highlight text={lawyer.email ?? '—'} query={search} />
                  </td>
                  <td>
                    <span className={lawyer.is_active ? 'text-ok' : 'text-faint'}>
                      {lawyer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Add New Lawyer" onClose={() => setCreateOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                placeholder="e.g. Advocate Md. Karim"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input
                className="input mt-1.5"
                placeholder="01711000000"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input
                className="input mt-1.5"
                type="email"
                placeholder="lawyer@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={createForm.is_active ?? true}
                onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editLawyer && (
        <Modal title={`Update ${editLawyer.name}`} onClose={() => setEditLawyer(null)}>
          <form className="flex flex-col gap-4" onSubmit={handleEdit}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input
                className="input mt-1.5"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input
                className="input mt-1.5"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={editForm.is_active ?? true}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditLawyer(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function CourtManagement() {
  const notify = useToast()

  const [courtList, setCourtList] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CourtPayload>(EMPTY_COURT_FORM)
  const [editCourt, setEditCourt] = useState<Court | null>(null)
  const [editForm, setEditForm] = useState<CourtPayload>(EMPTY_COURT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadCourts = () =>
    listCourts()
      .then(setCourtList)
      .catch((err: unknown) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void loadCourts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? courtList.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.location?.toLowerCase().includes(q),
        )
      : courtList
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [courtList, search])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createCourt({
        name: createForm.name.trim(),
        location: createForm.location?.trim() || undefined,
        is_active: createForm.is_active,
      })
      notify(messageOr(res.message, 'Court added successfully!'))
      setCreateOpen(false)
      setCreateForm(EMPTY_COURT_FORM)
      await loadCourts()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (court: Court) => {
    setEditCourt(court)
    setEditForm({
      name: court.name ?? '',
      location: court.location ?? '',
      is_active: court.is_active,
    })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editCourt) return
    setSaving(true)
    try {
      const res = await updateCourt(editCourt.id, {
        name: editForm.name.trim(),
        location: editForm.location?.trim() || undefined,
        is_active: editForm.is_active,
      })
      notify(messageOr(res.message, 'Court updated successfully!'))
      setEditCourt(null)
      setEditForm(EMPTY_COURT_FORM)
      await loadCourts()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (court: Court) => {
    setDeletingId(court.id)
    try {
      const res = await deleteCourt(court.id)
      notify(messageOr(res.message, 'Court removed'))
      setCourtList((list) => list.filter((c) => c.id !== court.id))
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="card-title">Court Names ({courtList.length})</h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-56"
            placeholder="Search courts…"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ExportButton onExport={exportCourts} disabled={loading || courtList.length === 0} />
          <button className="btn-primary" disabled={loading} onClick={() => setCreateOpen(true)}>
            <ShieldPlus size={15} /> Add Court
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Name</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4}>
                  <div className="flex items-center justify-center gap-2 py-10 text-muted">
                    <Spinner size={17} /> Loading courts…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState message="No courts found" />
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((court) => (
                <tr key={court.id}>
                  <td className="w-24 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(court)}
                      >
                        <Pencil size={13} />
                      </button>
                      <ConfirmDelete
                        title={court.name}
                        busy={deletingId === court.id}
                        onConfirm={() => handleDelete(court)}
                      />
                    </div>
                  </td>
                  <td className="font-medium">
                    <Highlight text={court.name} query={search} />
                  </td>
                  <td className="text-[12.5px] text-muted">
                    <Highlight text={court.location ?? '—'} query={search} />
                  </td>
                  <td>
                    <span className={court.is_active ? 'text-ok' : 'text-faint'}>
                      {court.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Add New Court" onClose={() => setCreateOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                placeholder="e.g. CMM Court, Dhaka"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input
                className="input mt-1.5"
                placeholder="e.g. Dhaka"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={createForm.is_active ?? true}
                onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editCourt && (
        <Modal title={`Update ${editCourt.name}`} onClose={() => setEditCourt(null)}>
          <form className="flex flex-col gap-4" onSubmit={handleEdit}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input
                className="input mt-1.5"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={editForm.is_active ?? true}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditCourt(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function CaseStatusManagement() {
  const notify = useToast()

  const [statuses, setStatuses] = useState<CaseStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CaseStatusPayload>(EMPTY_STATUS_FORM)
  const [editStatus, setEditStatus] = useState<CaseStatus | null>(null)
  const [editForm, setEditForm] = useState<CaseStatusPayload>(EMPTY_STATUS_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadStatuses = () =>
    listCaseStatuses()
      .then(setStatuses)
      .catch((err: unknown) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void loadStatuses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? statuses.filter((s) => s.name?.toLowerCase().includes(q)) : statuses
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [statuses, search])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createCaseStatus({
        name: createForm.name.trim(),
        is_active: createForm.is_active,
      })
      notify(messageOr(res.message, 'Status added successfully!'))
      setCreateOpen(false)
      setCreateForm(EMPTY_STATUS_FORM)
      await loadStatuses()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (status: CaseStatus) => {
    setEditStatus(status)
    setEditForm({ name: status.name ?? '', is_active: status.is_active })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editStatus) return
    setSaving(true)
    try {
      const res = await updateCaseStatus(editStatus.id, {
        name: editForm.name.trim(),
        is_active: editForm.is_active,
      })
      notify(messageOr(res.message, 'Status updated successfully!'))
      setEditStatus(null)
      setEditForm(EMPTY_STATUS_FORM)
      await loadStatuses()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (status: CaseStatus) => {
    setDeletingId(status.id)
    try {
      const res = await deleteCaseStatus(status.id)
      notify(messageOr(res.message, 'Status removed'))
      setStatuses((list) => list.filter((s) => s.id !== status.id))
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="card-title">Case Status Options ({statuses.length})</h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-56"
            placeholder="Search statuses…"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ExportButton onExport={exportCaseStatuses} disabled={loading || statuses.length === 0} />
          <button className="btn-primary" disabled={loading} onClick={() => setCreateOpen(true)}>
            <ShieldPlus size={15} /> Add Status
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3}>
                  <div className="flex items-center justify-center gap-2 py-10 text-muted">
                    <Spinner size={17} /> Loading statuses…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <EmptyState message="No statuses found" />
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((status) => (
                <tr key={status.id}>
                  <td className="w-24 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(status)}
                      >
                        <Pencil size={13} />
                      </button>
                      <ConfirmDelete
                        title={status.name}
                        busy={deletingId === status.id}
                        onConfirm={() => handleDelete(status)}
                      />
                    </div>
                  </td>
                  <td className="font-medium">
                    <Highlight text={status.name} query={search} />
                  </td>
                  <td>
                    <span className={status.is_active ? 'text-ok' : 'text-faint'}>
                      {status.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Add New Status" onClose={() => setCreateOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                placeholder="e.g. Appeal Filed"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={createForm.is_active ?? true}
                onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editStatus && (
        <Modal title={`Update ${editStatus.name}`} onClose={() => setEditStatus(null)}>
          <form className="flex flex-col gap-4" onSubmit={handleEdit}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={editForm.is_active ?? true}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditStatus(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default function Settings() {
  return (
    <div className="flex flex-col gap-4">
      <LawyerManagement />
      <CourtManagement />
      <CaseStatusManagement />
    </div>
  )
}
