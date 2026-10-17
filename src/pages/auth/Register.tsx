import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Scale, UserPlus } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../api/client'
import { useToast } from '../../toast'
import Spinner from '../../components/Spinner'

/** Public sign-up — new accounts start with the "Viewer" role. */
const DEFAULT_ROLE = 'Viewer'

export default function Register() {
  const { register } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const loggedIn = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        roles: [DEFAULT_ROLE],
      })
      if (loggedIn) {
        notify('Account created — welcome!')
        navigate('/', { replace: true })
      } else {
        notify('Account created — please sign in')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg p-5">
      <div className="w-full max-w-105">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-white">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Case Management</h1>
            <p className="text-[12.5px] text-faint">Estate &amp; Legal Affairs</p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-[15px] font-semibold">Create an account</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            New accounts are registered as {DEFAULT_ROLE}
          </p>

          {error && (
            <div className="mt-4 rounded-md border border-bad/25 bg-bad-soft px-3.5 py-2.5 text-[13px] font-medium text-bad">
              {error}
            </div>
          )}

          <form className="mt-4.5 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className="input mt-1.5"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input mt-1.5"
                placeholder="you@acibd.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-faint hover:text-ink"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="confirm">
                Confirm Password
              </label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                className="input mt-1.5"
                placeholder="Re-type your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary justify-center" disabled={submitting}>
              {submitting ? <Spinner /> : <UserPlus size={15} />}
              Create Account
            </button>
          </form>
        </div>

        <p className="mt-4.5 text-center text-[13px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
