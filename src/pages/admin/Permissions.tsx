import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { KeyRound, Pencil } from 'lucide-react'
import {
  createPermission,
  deletePermission,
  listPermissions,
  updatePermission,
} from '../../api/permissions'
import { getErrorMessage, messageOr } from '../../api/client'
import type { Permission } from '../../api/types'
import { useToast } from '../../toast'
import Modal from '../../components/Modal'
import ConfirmDelete from '../../components/ConfirmDelete'
import Spinner from '../../components/Spinner'
import Highlight from '../../components/Highlight'
import EmptyState from '../../components/EmptyState'

function NamingHint() {
  return (
    <p className="rounded-md bg-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted">
      ** Use lowercase <b>module.action</b> naming — the part before the first dot
      becomes the permission group. For example, the approve action of the Case
      module would be <b>case.approve</b>. Spaces are converted to underscores
      (e.g. <b>case.approve final</b> → <b>case.approve_final</b>).
    </p>
  )
}

export default function Permissions() {
  const notify = useToast()

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [editPermission, setEditPermission] = useState<Permission | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadPermissions = () =>
    listPermissions()
      .then((res) => setPermissions(res.permissions))
      .catch((err: unknown) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void loadPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? permissions.filter((p) => p.name?.toLowerCase().includes(q))
      : permissions
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [permissions, search])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createPermission(createName)
      notify(messageOr(res.message, 'Permission created successfully!'))
      setCreateOpen(false)
      setCreateName('')
      await loadPermissions()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editPermission) return
    setSaving(true)
    try {
      const res = await updatePermission(editPermission.id, editName)
      notify(messageOr(res.message, 'Permission updated successfully!'))
      setEditPermission(null)
      setEditName('')
      await loadPermissions()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (permission: Permission) => {
    setDeletingId(permission.id)
    try {
      const res = await deletePermission(permission.id)
      notify(messageOr(res.message, 'Permission deleted'))
      setSearch('')
      setPermissions((list) => list.filter((p) => p.id !== permission.id))
    } catch (err) {
      notify(getErrorMessage(err), 'error') // e.g. 409 — attached to a role
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Title & toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold tracking-tight">
          Permission List ({permissions.length})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-56"
            placeholder="Search permissions…"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn-primary"
            disabled={loading}
            onClick={() => setCreateOpen(true)}
          >
            <KeyRound size={15} /> Add New Permission
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-28">Actions</th>
              <th>Permission</th>
              <th>Group</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3}>
                  <div className="flex items-center justify-center gap-2 py-10 text-muted">
                    <Spinner size={17} /> Loading permissions…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <EmptyState message="No permissions found" />
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((permission) => (
                <tr key={permission.id}>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn-ghost btn-sm"
                        title="Edit"
                        onClick={() => {
                          setEditPermission(permission)
                          setEditName(permission.name ?? '')
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <ConfirmDelete
                        title={permission.name}
                        busy={deletingId === permission.id}
                        onConfirm={() => handleDelete(permission)}
                      />
                    </div>
                  </td>
                  <td className="lowercase">
                    <Highlight text={permission.name} query={search} />
                  </td>
                  <td>
                    <span className="pill bg-accent-soft text-accent lowercase">
                      {permission.name?.split('.')[0]}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Create permission */}
      {createOpen && (
        <Modal title="Create New Permission" onClose={() => setCreateOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                placeholder="e.g. case.approve"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>
            <NamingHint />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit permission */}
      {editPermission && (
        <Modal
          title={`Update ${editPermission.name?.toUpperCase() ?? ''}`}
          onClose={() => setEditPermission(null)}
        >
          <form className="flex flex-col gap-4" onSubmit={handleEdit}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <NamingHint />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditPermission(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <Spinner size={13} />} Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
