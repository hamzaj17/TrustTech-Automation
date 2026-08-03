import { useState } from 'react'
import type React from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

type TokenPair = {
  access_token: string
  refresh_token: string
}

async function readApiError(response: Response) {
  try {
    const body = await response.json()
    return body.detail || 'REQUEST FAILED.'
  } catch {
    return 'REQUEST FAILED.'
  }
}

const C = {
  indigo: '#1e1b6e',
  indigoTint: '#f0f0fc',
  sage: '#1a4d2e',
  sageTint: '#f0f7f3',
  rose: '#7c1f3a',
  roseTint: '#fdf0f4',
  amber: '#9a5f00',
  amberTint: '#fdf6ec',
}

// ── Shared chrome (top bar + bottom bar) ─────────────────────────────────────

function TopBar() {
  return (
    <div
      style={{
        borderBottom: '1px solid #000',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            background: C.indigo,
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.04em',
            }}
          >
            TT
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#000',
          }}
        >
          TRUSTTECH
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: '#aaa',
          letterSpacing: '0.06em',
        }}
      >
        AUTOMATION PLATFORM v4.2
      </span>
    </div>
  )
}

function BottomBar() {
  return (
    <div
      style={{
        borderTop: '1px solid #e5e5e5',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: '#ccc',
          letterSpacing: '0.06em',
        }}
      >
        TRUSTTECH © 2026
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: C.sage,
          letterSpacing: '0.06em',
        }}
      >
        ● ALL SYSTEMS OPERATIONAL
      </span>
    </div>
  )
}

// ── Reusable field ────────────────────────────────────────────────────────────

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  hint?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '8px',
        }}
      >
        <label
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#000',
          }}
        >
          {label}
        </label>
        {hint}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          border: `2px solid ${focused ? C.indigo : '#000'}`,
          background: focused ? C.indigoTint : '#fafafa',
          borderRadius: '2px',
          padding: '12px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 400,
          color: '#000',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        border: `1px solid ${C.rose}`,
        background: C.roseTint,
        color: C.rose,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        padding: '10px 14px',
        borderRadius: '2px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span>✗</span> {message}
    </div>
  )
}

// ── Success banner ────────────────────────────────────────────────────────────

function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        border: `1px solid ${C.sage}`,
        background: C.sageTint,
        color: C.sage,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        padding: '10px 14px',
        borderRadius: '2px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span>✓</span> {message}
    </div>
  )
}

// ── Primary button ────────────────────────────────────────────────────────────

function PrimaryButton({
  children,
  type = 'submit',
  disabled = false,
}: {
  children: React.ReactNode
  type?: 'submit' | 'button'
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        border: `2px solid ${C.indigo}`,
        background: hovered ? '#fafafa' : C.indigo,
        color: hovered ? C.indigo : '#fafafa',
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        padding: '14px 24px',
        borderRadius: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
        transition: 'none',
        marginBottom: '12px',
      }}
    >
      {children}
    </button>
  )
}

// ── Outline button ────────────────────────────────────────────────────────────

function OutlineButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        border: `2px solid ${hovered ? '#000' : '#ccc'}`,
        background: 'transparent',
        color: '#000',
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '13px 24px',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'none',
      }}
    >
      {children}
    </button>
  )
}

// ── SSO button ────────────────────────────────────────────────────────────────

function SSOButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        border: `2px solid ${hovered ? '#000' : '#ccc'}`,
        background: 'transparent',
        color: '#000',
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '12px 24px',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 700,
          color: '#555',
          border: '1px solid #ddd',
          padding: '1px 5px',
          borderRadius: '2px',
        }}
      >
        SSO
      </span>
      CONTINUE WITH SINGLE SIGN-ON
    </button>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ borderTop: '1px solid #e0e0e0', margin: '28px 0' }} />
}

// ── Password strength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const len = password.length
  const score = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4
  const labels = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG']
  const colors = ['#e0e0e0', C.rose, C.amber, C.amber, C.sage]

  if (!password) return null

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '3px',
              background: i <= score ? colors[score] : '#e0e0e0',
              borderRadius: '1px',
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: colors[score],
        }}
      >
        {labels[score]}
      </div>
    </div>
  )
}

// ── Sign In form ──────────────────────────────────────────────────────────────

function SignInForm({
  onLogin,
  onGoSignUp,
}: {
  onLogin: (accessToken: string, refreshToken: string) => void
  onGoSignUp: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotHovered, setForgotHovered] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('ALL FIELDS ARE REQUIRED.'); return }
    if (!email.includes('@')) { setError('ENTER A VALID EMAIL ADDRESS.'); return }
    if (password.length < 6) { setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS.'); return }
    setError('')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        setError(await readApiError(response))
        return
      }
      const tokens = (await response.json()) as TokenPair
      onLogin(tokens.access_token, tokens.refresh_token)
    } catch {
      setError('BACKEND IS NOT REACHABLE.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Heading */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: C.indigo,
            marginBottom: '12px',
          }}
        >
          SECURE ACCESS
        </div>
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#000',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Sign in to your workspace
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#888',
            marginTop: '10px',
            lineHeight: 1.5,
          }}
        >
          Enter your credentials to access the TrustTech dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="EMAIL ADDRESS"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setError('') }}
          placeholder="you@company.com"
        />
        <Field
          label="PASSWORD"
          type="password"
          value={password}
          onChange={(v) => { setPassword(v); setError('') }}
          placeholder="••••••••"
          hint={
            <span
              onMouseEnter={() => setForgotHovered(true)}
              onMouseLeave={() => setForgotHovered(false)}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: C.indigo,
                cursor: 'pointer',
                borderBottom: forgotHovered ? `1px solid ${C.indigo}` : '1px solid transparent',
                letterSpacing: '0.04em',
              }}
            >
              FORGOT PASSWORD?
            </span>
          }
        />

        {error && <ErrorBanner message={error} />}

        <div style={{ marginTop: '8px' }}>
          <PrimaryButton disabled={loading}>{loading ? 'SIGNING IN...' : 'SIGN IN TO TRUSTTECH'}</PrimaryButton>
          <OutlineButton onClick={onGoSignUp}>CREATE AN ACCOUNT</OutlineButton>
        </div>
      </form>

      <Divider />
      <SSOButton />

      <p
        style={{
          marginTop: '28px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: '#bbb',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        By signing in you agree to TrustTech&rsquo;s{' '}
        <span style={{ color: '#888', borderBottom: '1px solid #ddd', cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: '#888', borderBottom: '1px solid #ddd', cursor: 'pointer' }}>Privacy Policy</span>.
      </p>
    </>
  )
}

// ── Sign Up form ──────────────────────────────────────────────────────────────

function SignUpForm({
  onLogin,
  onGoSignIn,
}: {
  onLogin: (accessToken: string, refreshToken: string) => void
  onGoSignIn: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('FULL NAME IS REQUIRED.'); return }
    if (fullName.trim().split(' ').length < 2) { setError('PLEASE ENTER YOUR FIRST AND LAST NAME.'); return }
    if (!email) { setError('EMAIL ADDRESS IS REQUIRED.'); return }
    if (!email.includes('@') || !email.includes('.')) { setError('ENTER A VALID EMAIL ADDRESS.'); return }
    if (!password) { setError('PASSWORD IS REQUIRED.'); return }
    if (password.length < 8) { setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS.'); return }

    setLoading(true)
    try {
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName.trim(),
        }),
      })
      if (!registerResponse.ok) {
        setError(await readApiError(registerResponse))
        return
      }

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!loginResponse.ok) {
        setError(await readApiError(loginResponse))
        return
      }

      const tokens = (await loginResponse.json()) as TokenPair
      setSuccess(true)
      onLogin(tokens.access_token, tokens.refresh_token)
    } catch {
      setError('BACKEND IS NOT REACHABLE.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Heading */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: C.sage,
            marginBottom: '12px',
          }}
        >
          NEW ACCOUNT
        </div>
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#000',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Create your workspace
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#888',
            marginTop: '10px',
            lineHeight: 1.5,
          }}
        >
          Set up your TrustTech account. Free for 14 days, no card required.
        </p>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}
      >
        {['ACCOUNT', 'WORKSPACE', 'BILLING'].map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${i === 0 ? C.indigo : '#ddd'}`,
                background: i === 0 ? C.indigo : 'transparent',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 700,
                  color: i === 0 ? '#fafafa' : '#ccc',
                }}
              >
                {i + 1}
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: i === 0 ? C.indigo : '#ccc',
              }}
            >
              {step}
            </span>
            {i < 2 && (
              <div style={{ width: '20px', height: '1px', background: '#ddd' }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="FULL NAME"
          type="text"
          value={fullName}
          onChange={(v) => { setFullName(v); setError('') }}
          placeholder="Jane Doe"
        />
        <Field
          label="WORK EMAIL"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setError('') }}
          placeholder="jane@company.com"
        />

        {/* Password with strength */}
        <div style={{ marginBottom: '28px' }}>
          <label
            style={{
              display: 'block',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: '#000',
              marginBottom: '8px',
            }}
          >
            PASSWORD
          </label>
          <PasswordField
            value={password}
            onChange={(v) => { setPassword(v); setError('') }}
          />
          <PasswordStrength password={password} />
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              color: '#aaa',
              marginTop: '4px',
            }}
          >
            Minimum 8 characters.
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="ACCOUNT CREATED. REDIRECTING…" />}

        <div style={{ marginTop: '8px' }}>
          <PrimaryButton disabled={loading}>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</PrimaryButton>
          <OutlineButton onClick={onGoSignIn}>ALREADY HAVE AN ACCOUNT</OutlineButton>
        </div>
      </form>

      <Divider />

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: '#bbb',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        By creating an account you agree to TrustTech&rsquo;s{' '}
        <span style={{ color: '#888', borderBottom: '1px solid #ddd', cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: '#888', borderBottom: '1px solid #ddd', cursor: 'pointer' }}>Privacy Policy</span>.
      </p>
    </>
  )
}

// ── Password field with show/hide toggle ──────────────────────────────────────

function PasswordField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [toggleHovered, setToggleHovered] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="••••••••"
        style={{
          width: '100%',
          border: `2px solid ${focused ? C.indigo : '#000'}`,
          background: focused ? C.indigoTint : '#fafafa',
          borderRadius: '2px',
          padding: '12px 52px 12px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 400,
          color: '#000',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onMouseEnter={() => setToggleHovered(true)}
        onMouseLeave={() => setToggleHovered(false)}
        onClick={() => setVisible((v) => !v)}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: toggleHovered ? C.indigo : '#aaa',
          padding: '4px',
        }}
      >
        {visible ? 'HIDE' : 'SHOW'}
      </button>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function Login({
  onLogin,
}: {
  onLogin: (accessToken: string, refreshToken: string) => void
}) {
  const [view, setView] = useState<'signin' | 'signup'>('signin')

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {view === 'signin' ? (
            <SignInForm onLogin={onLogin} onGoSignUp={() => setView('signup')} />
          ) : (
            <SignUpForm onLogin={onLogin} onGoSignIn={() => setView('signin')} />
          )}
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
