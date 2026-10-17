import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, ShieldPlus } from 'lucide-react'
import {
  createRole,
  deleteRole,
  getRoleFormData,
  listRoles,
  updateRole,
} from '../../api/roles'
import { listPermissions } from '../../api/permissions'
import { getErrorMessage, messageOr } from '../../api/client'
import { toNames, type Role } from '../../api/types'
import { useToast } from '../../toast'
import Modal from '../../components/Modal'
import ConfirmDelete from '../../components/ConfirmDelete'
import Spinner from '../../components/Spinner'
import Highlight from '../../components/Highlight'
import EmptyState from '../../components/EmptyState'

interface RoleForm {
  name: string
  permission: string[]
}

const EMPTY_FORM: RoleForm = { name: '', permission: [] }

/** Checkbox list with Select All — shared by the create & edit modals. */
function PermissionPicker({
  options,
  loading,
  selected,
  onChange,
}: {
  options: string[]
  loading: boolean
  selected: string[]
  onChange: (next: string[]) => void
}) {
  if (loading) return <p className="mt-1.5 text-[13px] text-muted">Loading permissions…</p>

  const allSelected = options.length > 0 && selected.length === options.length
  const toggle = (name: string) =>
    onChange(
      selected.includes(name)
        ? selected.filter((p) => p !== name)
        : [...selected, name],
    )

  return (
    <div className="mt-1.5 max-h-77.5 overflow-y-auto rounded-md border border-border p-3">
      <label className="flex cursor-pointer items-center gap-2 pb-1.5 text-[13.5px] font-semibold text-accent">
        <input
          type="checkbox"
          className="h-4 w-4 accent-accent"
          checked={allSelected}
          onChange={() => onChange(allSelected ? [] : [...options])}
        />
        Select All
      </label>
      {options.map((name) => (
        <label
          key={name}
          className="flex cursor-pointer items-center gap-2 py-0.5 text-[13.5px] lowercase"
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-accent"
            checked={selected.includes(name)}
            onChange={() => toggle(name)}
          />
          {name}
        </label>
      ))}
      {options.length === 0 && (
        <p className="text-[13px] text-muted">No permissions available.</p>
      )}
    </div>
  )
}

export default function Roles() {
  const notify = useToast()

  const [roles, setRoles] = useState<Role[]>([])
  const [permissionOptions, setPermissionOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<RoleForm>(EMPTY_FORM)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [editForm, setEditForm] = useState<RoleForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadRoles = () =>
    listRoles()
      .then(setRoles)
      .catch((err: unknown) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void loadRoles()
    // Role form permissions come from GET /roles/create; fall back to /permissions.
    getRoleFormData()
      .then(async (fd) => {
        let names = toNames(fd.permissions)
        if (!names.length) names = toNames((await listPermissions()).permissions)
        setPermissionOptions(names.sort((a, b) => a.localeCompare(b)))
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setPermissionsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? roles.filter(
          (role) =>
            role.name?.toLowerCase().includes(q) ||
            role.permissions?.some((p) => p.name?.toLowerCase().includes(q)),
        )
      : roles
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [roles, search])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createRole({
        name: createForm.name.trim(),
        permission: createForm.permission,
      })
      notify(messageOr(res.message, 'Role created successfully!'))
      setCreateOpen(false)
      setCreateForm(EMPTY_FORM)
      await loadRoles()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (role: Role) => {
    setEditRole(role)
    setEditForm({ name: role.name ?? '', permission: toNames(role.permissions) })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editRole) return
    setSaving(true)
    try {
      const res = await updateRole(editRole.id, {
        name: editForm.name.trim(),
        permission: editForm.permission,
      })
      notify(messageOr(res.message, 'Role updated successfully!'))
      setEditRole(null)
      setEditForm(EMPTY_FORM)
      await loadRoles()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    setDeletingId(role.id)
    try {
      const res = await deleteRole(role.id)
      notify(messageOr(res.message, 'Role deleted'))
      setSearch('')
      setRoles((list) => list.filter((r) => r.id !== role.id))
    } catch (err) {
      notify(getErrorMessage(err), 'error') // e.g. 409 — role still assigned to users
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Title & toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold tracking-tight">
          Role List ({roles.length})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-56"
            placeholder="Search roles…"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn-primary"
            disabled={loading}
            onClick={() => setCreateOpen(true)}
          >
            <ShieldPlus size={15} /> Add New Role
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Role</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3}>
                  <div className="flex items-center justify-center gap-2 py-10 text-muted">
                    <Spinner size={17} /> Loading roles…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <EmptyState message="No roles found" />
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((role) => (
                <tr key={role.id}>
                  <td className="w-24 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(role)}
                      >
                        <Pencil size={13} />
                      </button>
                      <ConfirmDelete
                        title={role.name}
                        busy={deletingId === role.id}
                        onConfirm={() => handleDelete(role)}
                      />
                    </div>
                  </td>
                  <td className="font-medium capitalize">
                    <Highlight text={role.name} query={search} />
                  </td>
                  <td className="whitespace-normal text-[12.5px] text-muted">
                    {[...(role.permissions ?? [])]
                      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                      .map((p, i, arr) => (
                        <span key={p.id ?? p.name} className="lowercase">
                          <Highlight text={p.name} query={search} />
                          {i < arr.length - 1 && ', '}
                        </span>
                      ))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Create role */}
      {createOpen && (
        <Modal title="Create New Role" onClose={() => setCreateOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                placeholder="e.g. Legal Officer"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">
                Permission <span className="text-bad">*</span>
              </label>
              <PermissionPicker
                options={permissionOptions}
                loading={permissionsLoading}
                selected={createForm.permission}
                onChange={(permission) => setCreateForm({ ...createForm, permission })}
              />
            </div>
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

      {/* Edit role */}
      {editRole && (
        <Modal
          title={`Update ${editRole.name?.toUpperCase() ?? ''}`}
          onClose={() => setEditRole(null)}
        >
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
              <label className="field-label">
                Permission <span className="text-bad">*</span>
              </label>
              <PermissionPicker
                options={permissionOptions}
                loading={permissionsLoading}
                selected={editForm.permission}
                onChange={(permission) => setEditForm({ ...editForm, permission })}
              />
            </div>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditRole(null)}>
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
