import { useEffect, useMemo, useState } from 'react'
import Login from './Login'
import NewPost from './NewPost'
import { CLOUDFLARE_WORKER_URL, CLOUDFLARE_BEARER } from './ImageGenerator'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

const C = {
  indigo: '#1e1b6e',
  amber: '#9a5f00',
  sage: '#1a4d2e',
  rose: '#7c1f3a',
  indigoTint: '#f0f0fc',
  amberTint: '#fdf6ec',
  sageTint: '#f0f7f3',
  roseTint: '#fdf0f4',
}

const NAV_ITEMS = ['DASHBOARD', 'SCHEDULER', 'ACCOUNTS', 'CONTENT', 'ANALYTICS', 'SETTINGS']

type ContentDraft = {
  id: string
  topic: string
  caption: string | null
  call_to_action: string | null
  hashtags: string[] | null
  image_prompt: string | null
  image_url: string | null
  image_path: string | null
  platform: string | null
  scheduled_for: string | null
  approved_at: string | null
  rejected_at: string | null
  published_at: string | null
  rejection_reason: string | null
  status: string
  created_at: string
  updated_at: string
}

type SchedulerStatus = {
  total_jobs: number
  pending_jobs: number
  running_jobs: number
  succeeded_jobs: number
  failed_jobs: number
  retried_jobs: number
  last_run_at: string | null
}

type SchedulerJob = {
  id: string
  job_type: string
  status: string
  attempts: number
  max_attempts: number
  scheduled_for: string
  started_at: string | null
  finished_at: string | null
  error_message: string | null
  result: Record<string, unknown> | null
}

type BrandSettings = {
  company_name: string
  writing_tone: string
  target_audience: string
  website: string
  preferred_hashtags: string[]
  posting_interval_minutes: number
}

type Toast = { kind: 'ok' | 'error'; message: string } | null

function authHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  })
  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const body = await response.json()
      message = body.detail ?? message
    } catch {
      // Keep fallback message.
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

function OutlineButton({
  children,
  accent,
  small,
  color,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  accent?: boolean
  small?: boolean
  color?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const baseColor = color ?? (accent ? C.sage : '#000')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: small ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        padding: small ? '5px 12px' : '8px 18px',
        border: `2px solid ${baseColor}`,
        background: hovered && !disabled ? baseColor : 'transparent',
        color: hovered && !disabled ? '#fafafa' : baseColor,
        borderRadius: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '10px 24px',
        cursor: 'pointer',
        color: active ? C.indigo : '#000',
        borderLeft: active ? `3px solid ${C.indigo}` : '3px solid transparent',
        background: active ? C.indigoTint : 'transparent',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const color = status.includes('failed') || status.includes('rejected') ? C.rose
    : status.includes('scheduled') || status.includes('pending') ? C.amber
      : status.includes('published') || status.includes('succeeded') || status.includes('ready') || status.includes('approved') ? C.sage
        : C.indigo
  const tint = color === C.rose ? C.roseTint : color === C.amber ? C.amberTint : color === C.sage ? C.sageTint : C.indigoTint
  return (
    <span style={{
      border: `1px solid ${color}`,
      background: tint,
      color,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      padding: '3px 8px',
      borderRadius: '2px',
      textTransform: 'uppercase',
    }}>
      {status}
    </span>
  )
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={{ border: '1px solid #000', marginBottom: '24px' }}>
      <div style={{
        borderBottom: '1px solid #000',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f5f5f5',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>{title}</div>
        {action}
      </div>
      <div style={{ padding: '22px 24px' }}>{children}</div>
    </section>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('access_token')))
  const [activeNav, setActiveNav] = useState('DASHBOARD')
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null)
  const [jobs, setJobs] = useState<SchedulerJob[]>([])
  const [brand, setBrand] = useState<BrandSettings | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [busy, setBusy] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null)
  const [previewPrompt, setPreviewPrompt] = useState('')

  const metrics = useMemo(() => {
    const published = drafts.filter((d) => d.status.includes('published')).length
    const scheduled = drafts.filter((d) => d.status === 'scheduled').length
    const ready = drafts.filter((d) => ['ready', 'approved'].includes(d.status)).length
    return [
      { label: 'POSTS PUBLISHED', value: String(published), sub: 'DATABASE', color: C.indigo, tint: C.indigoTint },
      { label: 'READY POSTS', value: String(ready), sub: 'APPROVAL', color: C.sage, tint: C.sageTint },
      { label: 'SCHEDULED', value: String(scheduled), sub: 'PENDING', color: C.amber, tint: C.amberTint },
      { label: 'SCHEDULER JOBS', value: String(scheduler?.total_jobs ?? 0), sub: 'TOTAL', color: C.indigo, tint: C.indigoTint },
    ]
  }, [drafts, scheduler])

  async function loadData() {
    if (!localStorage.getItem('access_token')) return
    try {
      const [contentRows, schedulerStatus, schedulerJobs, brandSettings] = await Promise.all([
        api<ContentDraft[]>('/ai/content'),
        api<SchedulerStatus>('/scheduler/status'),
        api<SchedulerJob[]>('/scheduler/jobs'),
        api<BrandSettings>('/brand-settings'),
      ])
      setDrafts(contentRows)
      setScheduler(schedulerStatus)
      setJobs(schedulerJobs)
      setBrand(brandSettings)
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Load failed.' })
    }
  }

  useEffect(() => {
    if (loggedIn) void loadData()
  }, [loggedIn])

  async function runAction(label: string, action: () => Promise<void>) {
    setBusy(label)
    setToast(null)
    try {
      await action()
      await loadData()
      setToast({ kind: 'ok', message: `${label} completed.` })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : `${label} failed.` })
    } finally {
      setBusy('')
    }
  }

  function handleLogin(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    setLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setLoggedIn(false)
  }

  async function generatePost() {
    // Open the New Post UI instead of immediately running full generation
    setShowNewPost(true)
  }

  async function runScheduler() {
    await runAction('Run scheduler', async () => {
      await api<SchedulerStatus>('/scheduler/run', { method: 'POST' })
    })
  }

  async function retryFailed() {
    await runAction('Retry failed', async () => {
      await api<SchedulerStatus>('/scheduler/retry-failed', { method: 'POST' })
    })
  }

  async function approveDraft(id: string) {
    await runAction('Approve draft', async () => {
      await api<ContentDraft>(`/ai/content/${id}/approve`, { method: 'POST' })
    })
  }

  async function rejectDraft(id: string) {
    const reason = window.prompt('Reason for rejection?') ?? ''
    await runAction('Reject draft', async () => {
      await api<ContentDraft>(`/ai/content/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    })
  }

  async function scheduleDraft(id: string) {
    const scheduledFor = window.prompt('Schedule time, e.g. 2026-08-04T18:00:00+05:00')
    if (!scheduledFor) return
    await runAction('Schedule draft', async () => {
      await api<ContentDraft>(`/ai/content/${id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ platform: 'manual', scheduled_for: scheduledFor }),
      })
    })
  }

  async function generatePreviewForPrompt(prompt: string) {
    if (!prompt || !prompt.trim()) return alert('No prompt available for preview.')
    setPreviewVisible(true)
    setPreviewPrompt(prompt)
    setPreviewLoading(true)
    setPreviewImageSrc(null)
    // Prefer backend-generated file so preview matches saved local file.
    try {
      const result = await api<{ image_url: string; image_path: string; credits_left?: number }>("/ai/images/generate", {
        method: "POST",
        body: JSON.stringify({ image_prompt: prompt }),
      })
      if (result?.image_url) {
        try {
          const apiOrigin = new URL(API_BASE_URL).origin
          const absolute = result.image_url.startsWith('http') ? result.image_url : `${apiOrigin}${result.image_url}`
          setPreviewImageSrc(absolute)
        } catch {
          setPreviewImageSrc(result.image_url)
        }
        setPreviewLoading(false)
        return
      } else {
        console.warn('Backend returned no image_url, falling back to Cloudflare')
      }
    } catch (err) {
      console.warn('Backend preview failed, falling back to Cloudflare:', err)
    }

    // Fallback: try Cloudflare worker directly (only if backend unavailable)
    try {
      const cfResp = await fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_BEARER}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, image/*',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!cfResp.ok) throw new Error(`Cloudflare worker returned ${cfResp.status}`)

      const ct = cfResp.headers.get('Content-Type') || ''
      if (ct.startsWith('image/')) {
        const blob = await cfResp.blob()
        const url = URL.createObjectURL(blob)
        setPreviewImageSrc(url)
        setPreviewLoading(false)
        return
      }

      const data = await cfResp.json()
      if (data.image) {
        setPreviewImageSrc(`data:image/png;base64,${data.image}`)
        setPreviewLoading(false)
        return
      }
    } catch (err) {
      console.warn('Cloudflare preview also failed:', err)
      alert('Failed to generate preview image.')
    } finally {
      setPreviewLoading(false)
    }
  }

  function openPreviewForDraft(id: string) {
    const d = drafts.find((x) => x.id === id)
    if (!d) return
    // If the draft already has an image URL saved by the backend, use it directly
    if (d.image_url) {
      try {
        const apiOrigin = new URL(API_BASE_URL).origin
        const absolute = d.image_url.startsWith('http') ? d.image_url : `${apiOrigin}${d.image_url}`
        setPreviewImageSrc(absolute)
        setPreviewPrompt(d.image_prompt ?? '')
        setPreviewVisible(true)
        setPreviewLoading(false)
        return
      } catch {
        setPreviewImageSrc(d.image_url)
        setPreviewPrompt(d.image_prompt ?? '')
        setPreviewVisible(true)
        setPreviewLoading(false)
        return
      }
    }

    // Otherwise fall back to generating a preview from the prompt
    const p = d.image_prompt ?? d.caption ?? d.topic ?? ''
    void generatePreviewForPrompt(p)
  }

  function closePreview() {
    setPreviewVisible(false)
    setPreviewImageSrc(null)
    setPreviewPrompt('')
    setPreviewLoading(false)
  }

  async function mockPublish(id: string) {
    await runAction('Mock publish', async () => {
      await api<ContentDraft>(`/ai/content/${id}/publish-mock`, { method: 'POST' })
    })
  }

  async function exportDraft(id: string) {
    await runAction('Export draft', async () => {
      const exported = await api<{ post_text: string }>(`/ai/content/${id}/export`)
      await navigator.clipboard.writeText(exported.post_text)
      setToast({ kind: 'ok', message: 'Post text copied to clipboard.' })
    })
  }

  if (!loggedIn) return <Login onLogin={handleLogin} />

  const recentDrafts = drafts.slice(0, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fafafa', color: '#000', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '56px', background: '#fafafa', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '26px', height: '26px', background: C.indigo, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#fafafa' }}>TT</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em' }}>TRUSTTECH</div>
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '0.04em' }}>AUTOMATION PLATFORM</div>
        </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <OutlineButton small onClick={generatePost} disabled={Boolean(busy)}>NEW POST</OutlineButton>
            <OutlineButton accent small onClick={runScheduler} disabled={Boolean(busy)}>RUN SCHEDULER</OutlineButton>
            <OutlineButton small color={C.rose} onClick={handleLogout}>LOGOUT</OutlineButton>
          </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '200px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', paddingTop: '32px', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: '#aaa', padding: '0 24px', marginBottom: '16px' }}>NAVIGATION</div>
          {NAV_ITEMS.map((label) => <NavItem key={label} label={label} active={activeNav === label} onClick={() => setActiveNav(label)} />)}
          <div style={{ borderTop: '1px solid #e0e0e0', marginTop: 'auto', padding: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: '#aaa', marginBottom: '8px' }}>WORKSPACE</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{brand?.company_name ?? 'TrustTech'}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.sage, marginTop: '2px', letterSpacing: '0.04em' }}>ADMIN</div>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
          {showNewPost ? (
            <NewPost
              onBack={() => { setShowNewPost(false); void loadData(); setActiveNav('DASHBOARD'); }}
              onCreateDraft={(d: ContentDraft) => {
                setDrafts((prev) => [d, ...prev])
                setShowNewPost(false)
                setActiveNav('CONTENT')
                setToast({ kind: 'ok', message: 'Post added to recent content.' })
              }}
            />
          ) : null}
          <div style={{ display: showNewPost ? 'none' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '26px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{activeNav.charAt(0) + activeNav.slice(1).toLowerCase()}</h1>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#aaa', marginTop: '4px', letterSpacing: '0.04em' }}>
                {new Date().toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <OutlineButton small color={C.indigo} onClick={loadData}>REFRESH</OutlineButton>
              <OutlineButton small onClick={() => setActiveNav('CONTENT')}>CONTENT</OutlineButton>
            </div>
          </div>

          {toast && (
            <div style={{ border: `1px solid ${toast.kind === 'ok' ? C.sage : C.rose}`, background: toast.kind === 'ok' ? C.sageTint : C.roseTint, color: toast.kind === 'ok' ? C.sage : C.rose, padding: '10px 14px', marginBottom: '20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600 }}>
              {toast.message}
            </div>
          )}

          {activeNav === 'DASHBOARD' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #000', marginBottom: '32px' }}>
                {metrics.map((m, i) => (
                  <div key={m.label} style={{ borderRight: i < metrics.length - 1 ? '1px solid #000' : 'none', padding: '28px 32px', background: m.tint, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: m.color }} />
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#555', marginBottom: '10px' }}>{m.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '44px', fontWeight: 700, lineHeight: 1, color: m.color }}>{m.value}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#aaa', marginTop: '6px' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <SchedulerPanel scheduler={scheduler} onRun={runScheduler} onRetry={retryFailed} busy={Boolean(busy)} />
              <ContentTable drafts={recentDrafts} title="RECENT CONTENT" onApprove={approveDraft} onReject={rejectDraft} onSchedule={scheduleDraft} onPublish={mockPublish} onExport={exportDraft} onPreview={openPreviewForDraft} busy={Boolean(busy)} />
            </>
          )}

          {activeNav === 'SCHEDULER' && (
            <>
              <SchedulerPanel scheduler={scheduler} onRun={runScheduler} onRetry={retryFailed} busy={Boolean(busy)} />
              <Panel title="SCHEDULER JOBS">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 1fr', gap: '12px', fontSize: '12px' }}>
                  {jobs.map((job) => (
                    <div key={job.id} style={{ display: 'contents' }}>
                      <div>{job.job_type}</div>
                      <StatusPill status={job.status} />
                      <div>{job.attempts}/{job.max_attempts}</div>
                      <div style={{ color: '#777' }}>{job.error_message ?? JSON.stringify(job.result ?? {})}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {activeNav === 'CONTENT' && (
            <ContentTable drafts={drafts} title="CONTENT DRAFTS" onApprove={approveDraft} onReject={rejectDraft} onSchedule={scheduleDraft} onPublish={mockPublish} onExport={exportDraft} onPreview={openPreviewForDraft} busy={Boolean(busy)} />
          )}

          {activeNav === 'SETTINGS' && (
            <Panel title="BRAND SETTINGS" action={<OutlineButton small onClick={loadData}>LOAD</OutlineButton>}>
              <SettingsView brand={brand} />
            </Panel>
          )}

          {activeNav === 'ACCOUNTS' && (
            <Panel title="CONNECTED ACCOUNTS">
              <div style={{ color: '#777', fontSize: '13px' }}>Social account APIs are not connected yet. Current manual publishing flow uses content export and mock publish.</div>
            </Panel>
          )}

          {activeNav === 'ANALYTICS' && (
            <Panel title="ANALYTICS">
              <div style={{ color: '#777', fontSize: '13px' }}>Analytics will become live after real social publishing APIs are connected.</div>
            </Panel>
          )}
          </div>
        </main>
      </div>
      {previewVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 'min(920px, 96%)', background: '#fff', border: '1px solid #000', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 700 }}>Image Preview</div>
              <div>
                <OutlineButton small onClick={closePreview}>CLOSE</OutlineButton>
              </div>
            </div>
            <div style={{ padding: '16px', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
              {previewLoading ? (
                <div>Generating image…</div>
              ) : previewImageSrc ? (
                <img src={previewImageSrc} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '6px' }} />
              ) : (
                <div style={{ color: '#777' }}>No image available for this prompt.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SchedulerPanel({ scheduler, onRun, onRetry, busy }: { scheduler: SchedulerStatus | null; onRun: () => void; onRetry: () => void; busy: boolean }) {
  const rows = [
    ['TOTAL JOBS', scheduler?.total_jobs ?? 0, C.indigo],
    ['SUCCEEDED', scheduler?.succeeded_jobs ?? 0, C.sage],
    ['FAILED', scheduler?.failed_jobs ?? 0, C.rose],
    ['PENDING', scheduler?.pending_jobs ?? 0, C.amber],
    ['RUNNING', scheduler?.running_jobs ?? 0, C.sage],
    ['LAST RUN', scheduler?.last_run_at ? new Date(scheduler.last_run_at).toLocaleString() : 'NONE', '#555'],
  ]
  return (
    <Panel title="SCHEDULER STATUS" action={<div style={{ display: 'flex', gap: '8px' }}><OutlineButton small accent onClick={onRun} disabled={busy}>RUN NOW</OutlineButton><OutlineButton small color={C.amber} onClick={onRetry} disabled={busy}>RETRY FAILED</OutlineButton></div>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {rows.map(([label, value, color]) => (
          <div key={String(label)} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: '#aaa' }}>{label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '16px', fontWeight: 700, color: String(color), marginTop: '4px' }}>{String(value)}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function ContentTable({
  drafts,
  title,
  onApprove,
  onReject,
  onSchedule,
  onPublish,
  onExport,
  onPreview,
  busy,
}: {
  drafts: ContentDraft[]
  title: string
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onSchedule: (id: string) => void
  onPublish: (id: string) => void
  onExport: (id: string) => void
  onPreview: (id: string) => void
  busy: boolean
}) {
  return (
    <Panel title={title}>
      {drafts.length === 0 ? (
        <div style={{ color: '#777', fontSize: '13px' }}>No content yet. Use NEW POST to generate one.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {drafts.map((draft) => (
            <div key={draft.id} style={{ borderBottom: '1px solid #eee', padding: '16px 0', display: 'grid', gridTemplateColumns: '1fr 130px 350px', gap: '18px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{draft.topic}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>{draft.caption ?? 'No caption'}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#aaa', marginTop: '6px' }}>{draft.platform ?? 'manual'} {draft.scheduled_for ? `- ${new Date(draft.scheduled_for).toLocaleString()}` : ''}</div>
              </div>
              <StatusPill status={draft.status} />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <OutlineButton small accent onClick={() => onApprove(draft.id)} disabled={busy}>APPROVE</OutlineButton>
                <OutlineButton small color={C.rose} onClick={() => onReject(draft.id)} disabled={busy}>REJECT</OutlineButton>
                <OutlineButton small color={C.amber} onClick={() => onSchedule(draft.id)} disabled={busy}>SCHEDULE</OutlineButton>
                <OutlineButton small color={C.indigo} onClick={() => onExport(draft.id)} disabled={busy}>COPY</OutlineButton>
                <OutlineButton small onClick={() => onPublish(draft.id)} disabled={busy}>PUBLISH</OutlineButton>
                <OutlineButton small color={C.indigo} onClick={() => onPreview(draft.id)} disabled={busy}>PREVIEW</OutlineButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function SettingsView({ brand }: { brand: BrandSettings | null }) {
  if (!brand) return <div style={{ color: '#777' }}>Brand settings not loaded.</div>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', fontSize: '13px' }}>
      <b>Company</b><span>{brand.company_name}</span>
      <b>Website</b><span>{brand.website}</span>
      <b>Tone</b><span>{brand.writing_tone}</span>
      <b>Audience</b><span>{brand.target_audience}</span>
      <b>Hashtags</b><span>{brand.preferred_hashtags.join(' ')}</span>
      <b>Interval</b><span>{brand.posting_interval_minutes} minutes</span>
    </div>
  )
}
