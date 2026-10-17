import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Scale,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react'
import { todayLong } from '../utils'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../toast'

interface NavLeaf {
  to: string
  label: string
  icon: typeof LayoutDashboard
  title: string
  end?: boolean
}

const NAV: NavLeaf[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, title: 'Dashboard', end: true },
  { to: '/cases', label: 'Cases', icon: FolderKanban, title: 'Case Management' },
  { to: '/create', label: 'Create Case', icon: PlusCircle, title: 'Create New Case' },
  // { to: '/reporting', label: 'Reporting', icon: FileBarChart, title: 'Reporting & Export' },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp, title: 'Analytics & Insights' },
  { to: '/settings', label: 'Settings', icon: Settings, title: 'Settings & Administration' },
]

/** Administrator › sub-menus (Postman: Administrator › User / Role / Permission). */
const ADMIN_NAV: NavLeaf[] = [
  { to: '/admin/users', label: 'User Management', icon: Users, title: 'User Management' },
  { to: '/admin/roles', label: 'Role Management', icon: ShieldCheck, title: 'Role Management' },
  { to: '/admin/permissions', label: 'Permission Management', icon: KeyRound, title: 'Permission Management' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2.5 rounded-md px-3 py-2.5 font-medium transition',
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-muted hover:bg-bg hover:text-ink',
  ].join(' ')

function initials(name?: string): string {
  if (!name) return 'CU'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export default function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const notify = useToast()

  const inAdmin = pathname.startsWith('/admin')
  const [adminOpen, setAdminOpen] = useState(inAdmin)

  const active =
    [...NAV, ...ADMIN_NAV].find((n) =>
      n.end ? pathname === n.to : pathname.startsWith(n.to) && n.to !== '/',
    ) ?? NAV[0]

  const handleLogout = async () => {
    await logout()
    notify('Signed out', 'info')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-[244px] flex-col overflow-y-auto border-r border-border bg-surface px-3.5 py-5.5 max-[860px]:-translate-x-full">
        <div className="mb-3.5 flex items-center gap-2.5 border-b border-border px-2.5 pb-5.5 pt-1">
          <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-accent text-white">
            <Scale size={19} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Case Management</h1>
            <p className="text-[11px] text-faint">Estate &amp; Legal Affairs</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
              <n.icon size={18} />
              <span>{n.label}</span>
            </NavLink>
          ))}

          {/* Administrator group */}
          <button
            type="button"
            className={[
              'flex items-center gap-2.5 rounded-md px-3 py-2.5 font-medium transition',
              inAdmin ? 'text-accent' : 'text-muted hover:bg-bg hover:text-ink',
            ].join(' ')}
            onClick={() => setAdminOpen((open) => !open)}
            aria-expanded={adminOpen}
          >
            <UserCog size={18} />
            <span>Administrator</span>
            <ChevronDown
              size={15}
              className={`ml-auto transition-transform ${adminOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {adminOpen && (
            <div className="ml-4.5 flex flex-col gap-0.5 border-l border-border pl-2">
              {ADMIN_NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={linkClass}>
                  <n.icon size={16} />
                  <span className="text-[13px]">{n.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 ml-[244px] max-[860px]:ml-0">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-border bg-surface px-7">
          <h2 className="text-[17px] font-semibold tracking-tight">{active.title}</h2>
          <div className="flex items-center gap-3.5 text-[13px] text-muted">
            <span>{todayLong()}</span>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                {initials(user?.name)}
              </div>
              {user?.name && (
                <span className="max-w-40 truncate font-medium text-ink">{user.name}</span>
              )}
            </div>
            <button
              className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-bad-soft hover:text-bad"
              title="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="px-7 pb-15 pt-6.5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
