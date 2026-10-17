import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, UserPlus } from 'lucide-react'
import {
  createUser,
  deleteUser,
  getUserFormData,
  listUsers,
  toggleUserStatus,
  updateUser,
} from '../../api/users'
import { getErrorMessage, messageOr } from '../../api/client'
import { isActive, toNames, userPermissionNames, type AdminUser } from '../../api/types'
import { useToast } from '../../toast'
import Modal from '../../components/Modal'
import ConfirmDelete from '../../components/ConfirmDelete'
import Spinner from '../../components/Spinner'
import Highlight from '../../components/Highlight'
import EmptyState from '../../components/EmptyState'

interface CreateForm {
  name: string
  email: string
  password: string
  role: string
}

interface EditForm {
  name: string
  email: string
  password: string
  status: '1' | '0'
  roles: string[]
}

const EMPTY_CREATE: CreateForm = { name: '', email: '', password: '', role: '' }

const byName = (a: { name?: string }, b: { name?: string }) =>
  (a.name ?? '').localeCompare(b.name ?? '')

export default function Users() {
  const notify = useToast()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const loadUsers = () =>
    listUsers()
      .then(setUsers)
      .catch((err: unknown) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void loadUsers()
    getUserFormData()
      .then((fd) => setRoleOptions(toNames(fd.roles)))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setRolesLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? users.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.roles?.some((r) => r.name?.toLowerCase().includes(q)) ||
            userPermissionNames(u).some((p) => p.toLowerCase().includes(q)),
        )
      : users
    return [...list].sort(byName)
  }, [users, search])

  /* ----- create ----- */
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        status: true,
        roles: [createForm.role],
      })
      notify(messageOr(res.message, 'User created successfully!'))
      setCreateOpen(false)
      setCreateForm(EMPTY_CREATE)
      await loadUsers()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ----- edit ----- */
  const openEdit = (user: AdminUser) => {
    setEditUser(user)
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
      password: '',
      status: isActive(user.status) ? '1' : '0',
      roles: toNames(user.roles),
    })
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editUser || !editForm) return
    setSaving(true)
    try {
      const res = await updateUser(editUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        status: editForm.status === '1',
        roles: editForm.roles,
        ...(editForm.password ? { password: editForm.password } : {}),
      })
      notify(messageOr(res.message, 'User updated successfully!'))
      setEditUser(null)
      setEditForm(null)
      await loadUsers()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ----- toggle status / delete ----- */
  const handleToggle = async (user: AdminUser) => {
    setTogglingId(user.id)
    try {
      const res = await toggleUserStatus(user.id)
      notify(messageOr(res.message, 'User status updated'))
      setUsers((list) =>
        list.map((u) =>
          u.id === user.id ? { ...u, status: isActive(u.status) ? 0 : 1 } : u,
        ),
      )
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    setDeletingId(user.id)
    try {
      const res = await deleteUser(user.id)
      notify(messageOr(res.message, 'User deleted'))
      setSearch('')
      setUsers((list) => list.filter((u) => u.id !== user.id))
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleEditRole = (role: string) => {
    setEditForm((form) =>
      form
        ? {
            ...form,
            roles: form.roles.includes(role)
              ? form.roles.filter((r) => r !== role)
              : [...form.roles, role],
          }
        : form,
    )
  }

  return (
    <>
      {/* Title & toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold tracking-tight">
          All Users ({users.length})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-56"
            placeholder="Search users…"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <UserPlus size={15} /> Add New User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-4 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Actions</th>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>
                  <div className="flex items-center justify-center gap-2 py-10 text-muted">
                    <Spinner size={17} /> Loading users…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="No users found" />
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((user) => {
                const active = isActive(user.status)
                return (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil size={13} />
                        </button>
                        <ConfirmDelete
                          title={user.name}
                          busy={deletingId === user.id}
                          onConfirm={() => handleDelete(user)}
                        />
                      </div>
                    </td>
                    <td className="font-medium capitalize">
                      <Highlight text={user.name} query={search} />
                    </td>
                    <td>
                      <Highlight text={user.email} query={search} />
                    </td>
                    <td>
                      <button
                        className={`pill cursor-pointer ${active ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}
                        title="Click to toggle status"
                        disabled={togglingId === user.id}
                        onClick={() => handleToggle(user)}
                      >
                        {togglingId === user.id ? (
                          <Spinner size={11} />
                        ) : active ? (
                          'Active'
                        ) : (
                          'Inactive'
                        )}
                      </button>
                    </td>
                    <td className="capitalize">
                      {[...(user.roles ?? [])].sort(byName).map((role, i, arr) => (
                        <span key={role.id ?? role.name}>
                          <Highlight text={role.name} query={search} />
                          {i < arr.length - 1 && ', '}
                        </span>
                      ))}
                    </td>
                    <td className="max-w-90 whitespace-normal text-[12.5px] text-muted">
                      {userPermissionNames(user)
                        .sort((a, b) => a.localeCompare(b))
                        .map((p, i, arr) => (
                          <span key={p}>
                            <Highlight text={p} query={search} />
                            {i < arr.length - 1 && ', '}
                          </span>
                        ))}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Create user */}
      {createOpen && (
        <Modal title="Create New User" onClose={() => setCreateOpen(false)}>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div>
              <label className="field-label">
                Name <span className="text-bad">*</span>
              </label>
              <input
                className="input mt-1.5"
                placeholder="Full name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">
                Email <span className="text-bad">*</span>
              </label>
              <input
                type="email"
                className="input mt-1.5"
                placeholder="user@acibd.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">
                Password <span className="text-bad">*</span>
              </label>
              <input
                type="password"
                className="input mt-1.5"
                placeholder="Minimum 6 characters"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">
                Role <span className="text-bad">*</span>
              </label>
              {rolesLoading ? (
                <p className="mt-1.5 text-[13px] text-muted">Loading roles…</p>
              ) : (
                <select
                  className="input mt-1.5 capitalize"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  required
                >
                  <option value="">-- Select --</option>
                  {[...roleOptions].sort((a, b) => a.localeCompare(b)).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              )}
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

      {/* Edit user */}
      {editUser && editForm && (
        <Modal
          title={`Update ${editUser.name?.toUpperCase() ?? ''}`}
          onClose={() => setEditUser(null)}
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
                Email <span className="text-bad">*</span>
              </label>
              <input
                type="email"
                className="input mt-1.5"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">New Password</label>
              <input
                type="password"
                className="input mt-1.5"
                placeholder="Leave blank to keep the current password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">
                Status <span className="text-bad">*</span>
              </label>
              <select
                className="input mt-1.5"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value as '1' | '0' })
                }
                required
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div>
              <label className="field-label">
                Role <span className="text-bad">*</span>
              </label>
              {rolesLoading ? (
                <p className="mt-1.5 text-[13px] text-muted">Loading roles…</p>
              ) : (
                <div className="mt-1.5 flex max-h-60 flex-col gap-1.5 overflow-y-auto">
                  {[...roleOptions].sort((a, b) => a.localeCompare(b)).map((role) => (
                    <label
                      key={role}
                      className="flex cursor-pointer items-center gap-2 text-[13.5px] capitalize"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-accent"
                        checked={editForm.roles.includes(role)}
                        onChange={() => toggleEditRole(role)}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-1 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditUser(null)}>
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
