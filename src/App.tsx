import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './auth/RequireAuth'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Cases from './pages/Cases'
import CreateCase from './pages/CreateCase'
import Reporting from './pages/Reporting'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Users from './pages/admin/Users'
import Roles from './pages/admin/Roles'
import Permissions from './pages/admin/Permissions'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      {/* Authenticated */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<Cases />} />
          <Route path="create" element={<CreateCase />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          {/* Administrator */}
          <Route path="admin/users" element={<Users />} />
          <Route path="admin/roles" element={<Roles />} />
          <Route path="admin/permissions" element={<Permissions />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
