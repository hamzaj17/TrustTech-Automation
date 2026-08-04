import { useState, useRef, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

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

const PLATFORMS = [
  { id: 'instagram', label: 'INSTAGRAM',     limit: 2200 },
  { id: 'facebook',  label: 'FACEBOOK',      limit: 63206 },
  { id: 'tiktok',    label: 'TIKTOK',        limit: 3000 },
]

function PlatformChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '6px 14px',
        border: selected ? `2px solid ${C.indigo}` : `2px solid ${hovered ? '#000' : '#ccc'}`,
        background: selected ? C.indigoTint : 'transparent',
        color: selected ? C.indigo : hovered ? '#000' : '#888',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {selected && <span style={{ fontSize: '11px' }}>✓</span>}
      {label}
    </button>
  )
}

function ImageUploadArea({
  file,
  preview,
  dragging,
  onFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  inputRef,
}: {
  file: File | null
  preview: string | null
  dragging: boolean
  onFile: (f: File) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onRemove: () => void
  inputRef: React.RefObject<HTMLInputElement>
}) {
  const [areaHovered, setAreaHovered] = useState(false)

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onMouseEnter={() => setAreaHovered(true)}
          onMouseLeave={() => setAreaHovered(false)}
          style={{
            border: `2px dashed ${dragging ? C.indigo : areaHovered ? '#000' : '#ccc'}`,
            background: dragging ? C.indigoTint : areaHovered ? '#f5f5f5' : '#fafafa',
            borderRadius: '2px',
            padding: '56px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: '12px',
          }}
        >
          {/* Upload icon — geometric, no SVG lib needed */}
          <div
            style={{
              width: '48px',
              height: '48px',
              border: `2px solid ${dragging ? C.indigo : '#ccc'}`,
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dragging ? C.indigo : '#bbb',
              fontSize: '22px',
              fontWeight: 300,
            }}
          >
            ↑
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: dragging ? C.indigo : '#000',
                marginBottom: '4px',
              }}
            >
              {dragging ? 'Drop to upload' : 'Drag & drop an image'}
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: 400,
                color: '#aaa',
              }}
            >
              or{' '}
              <span
                style={{
                  color: C.indigo,
                  fontWeight: 600,
                  borderBottom: `1px solid ${C.indigo}`,
                  cursor: 'pointer',
                }}
              >
                browse files
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 400,
              color: '#ccc',
              letterSpacing: '0.06em',
              marginTop: '4px',
            }}
          >
            JPG · PNG · GIF · WEBP — MAX 20MB
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid #000', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
          <img
            src={preview}
            alt="Upload preview"
            style={{
              width: '100%',
              maxHeight: '340px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* File info bar */}
          <div
            style={{
              borderTop: '1px solid #000',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  border: `1px solid ${C.sage}`,
                  background: C.sageTint,
                  color: C.sage,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '2px 6px',
                  borderRadius: '2px',
                }}
              >
                ✓ UPLOADED
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 400,
                  color: '#555',
                }}
              >
                {file?.name}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 400,
                  color: '#aaa',
                }}
              >
                {file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={onRemove}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: C.rose,
                border: `1px solid ${C.rose}`,
                background: C.roseTint,
                borderRadius: '2px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              REMOVE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CharCount({ count, limit }: { count: number; limit: number }) {
  const pct = count / limit
  const color = pct > 0.95 ? C.rose : pct > 0.8 ? C.amber : '#aaa'
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 600,
        color,
        letterSpacing: '0.04em',
      }}
    >
      {count}/{limit}
    </span>
  )
}

export default function NewPost({ onBack, onCreateDraft }: { onBack: () => void; onCreateDraft?: (d: any) => void }) {
  const [topic, setTopic] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [captionFocused, setCaptionFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [backHovered, setBackHovered] = useState(false)
  const [submitHovered, setSubmitHovered] = useState(false)
  const [draftHovered, setDraftHovered] = useState(false)
  const [dateFocused, setDateFocused] = useState(false)
  const [timeFocused, setTimeFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null!)

  const activePlatform = PLATFORMS.find((p) => selectedPlatforms.includes(p.id))
  const charLimit = activePlatform?.limit ?? 280
  const mostRestrictive = PLATFORMS.filter((p) => selectedPlatforms.includes(p.id))
    .reduce((min, p) => (p.limit < min ? p.limit : min), Infinity)

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleRemove() {
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }, [])

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    setError('')
    if (!topic.trim()) { setError('TOPIC IS REQUIRED.'); return }
    if (!caption.trim()) { setError('CAPTION IS REQUIRED.'); return }
    if (selectedPlatforms.length === 0) { setError('SELECT AT LEAST ONE PLATFORM.'); return }
    if (!file) { setError('MEDIA IS REQUIRED. Please upload an image.'); return }
    if (scheduleMode === 'schedule' && (!scheduleDate || !scheduleTime)) {
      setError('SET A DATE AND TIME TO SCHEDULE.'); return
    }

    // Read file as base64
    const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const comma = result.indexOf(',')
        resolve(comma >= 0 ? result.slice(comma + 1) : result)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(f)
    })

    let image_b64 = null
    try {
      image_b64 = await toBase64(file as File)
    } catch (err) {
      setError('Failed to read image file.'); return
    }

    const suffix = file?.type.includes('png') ? '.png' : file?.type.includes('jpeg') || file?.type.includes('jpg') ? '.jpg' : file?.type.includes('webp') ? '.webp' : '.png'
    const scheduled_for = scheduleMode === 'schedule' ? `${scheduleDate}T${scheduleTime}` : null

    const token = localStorage.getItem('access_token')
    try {
      const resp = await fetch(`${API_BASE_URL}/ai/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: topic.trim(),
          caption,
          call_to_action: null,
          hashtags: [],
          image_prompt: null,
          image_base64: image_b64,
          image_suffix: suffix,
          platform: selectedPlatforms[0] ?? null,
          scheduled_for: scheduled_for,
          publish_now: scheduleMode === 'now',
        }),
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.detail ?? `Create failed: ${resp.status}`)
      }

      const created = await resp.json()
      try { onCreateDraft?.(created) } catch {}
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create request failed')
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '24px',
          padding: '40px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            border: `2px solid ${C.sage}`,
            background: C.sageTint,
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: C.sage,
          }}
        >
          ✓
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#000',
              letterSpacing: '-0.01em',
              marginBottom: '8px',
            }}
          >
            {scheduleMode === 'now' ? 'Post published.' : 'Post scheduled.'}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              color: '#888',
              letterSpacing: '0.04em',
            }}
          >
            {scheduleMode === 'schedule'
              ? `SCHEDULED FOR ${scheduleDate} AT ${scheduleTime} UTC`
              : (selectedPlatforms.length > 0 ? `PUBLISHED TO ${selectedPlatforms.length} PLATFORM${selectedPlatforms.length > 1 ? 'S' : ''}` : 'NO PLATFORM SELECTED')}
          </div>
        </div>
        <button
          onClick={onBack}
          style={{
            marginTop: '8px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '12px 28px',
            border: `2px solid ${C.indigo}`,
            background: C.indigo,
            color: '#fafafa',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          BACK TO DASHBOARD
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '40px 48px',
        background: '#fafafa',
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onBack}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: backHovered ? '#000' : '#888',
              border: `1px solid ${backHovered ? '#000' : '#ddd'}`,
              background: 'transparent',
              borderRadius: '2px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← BACK
          </button>
          <div>
            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: '#000',
                margin: 0,
              }}
            >
              New Post
            </h1>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#aaa',
                marginTop: '3px',
                letterSpacing: '0.04em',
              }}
            >
              COMPOSE AND PUBLISH
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '9px 24px',
              border: `2px solid ${C.indigo}`,
              background: submitHovered ? '#fafafa' : C.indigo,
              color: submitHovered ? C.indigo : '#fafafa',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            {scheduleMode === 'now' ? 'PUBLISH NOW' : 'SCHEDULE POST'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            border: `1px solid ${C.rose}`,
            background: C.roseTint,
            color: C.rose,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            padding: '10px 16px',
            borderRadius: '2px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✗</span> {error}
        </div>
      )}

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Caption + Image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Topic */}
          <div style={{ border: '1px solid #000' }}>
            <div
              style={{
                borderBottom: '1px solid #000',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f5f5f5',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                TOPIC
              </span>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic/title for this post"
                style={{
                  width: '100%',
                  border: '2px solid transparent',
                  background: 'transparent',
                  borderRadius: '2px',
                  padding: '10px 12px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Caption */}
          <div style={{ border: '1px solid #000' }}>
            <div
              style={{
                borderBottom: '1px solid #000',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f5f5f5',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                CAPTION
              </span>
              {selectedPlatforms.length > 0 && (
                <CharCount
                  count={caption.length}
                  limit={isFinite(mostRestrictive) ? mostRestrictive : 280}
                />
              )}
            </div>
            <div style={{ padding: '4px' }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onFocus={() => setCaptionFocused(true)}
                onBlur={() => setCaptionFocused(false)}
                placeholder="Write your caption here…"
                rows={9}
                style={{
                  width: '100%',
                  border: captionFocused ? `2px solid ${C.indigo}` : '2px solid transparent',
                  background: captionFocused ? C.indigoTint : 'transparent',
                  borderRadius: '2px',
                  padding: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#000',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              />
            </div>
            {/* Quick-insert toolbar */}
            <div
              style={{
                borderTop: '1px solid #e0e0e0',
                padding: '10px 20px',
                display: 'flex',
                gap: '6px',
              }}
            >
              {['#', '@', '🔗', '✦'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setCaption((c) => c + sym)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    padding: '4px 10px',
                    border: '1px solid #ddd',
                    background: 'transparent',
                    color: '#555',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  {sym}
                </button>
              ))}
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: '#bbb',
                  alignSelf: 'center',
                }}
              >
                Quick insert
              </span>
            </div>
          </div>

          {/* Image upload */}
          <div style={{ border: '1px solid #000' }}>
            <div
              style={{
                borderBottom: '1px solid #000',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f5f5f5',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                MEDIA
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: '#aaa',
                  letterSpacing: '0.06em',
                }}
              >
                OPTIONAL
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <ImageUploadArea
                file={file}
                preview={preview}
                dragging={dragging}
                onFile={handleFile}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onRemove={handleRemove}
                inputRef={inputRef}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Settings panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Platforms */}
          <div style={{ border: '1px solid #000' }}>
            <div
              style={{
                borderBottom: '1px solid #000',
                padding: '14px 20px',
                background: '#f5f5f5',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                PUBLISH TO
              </span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PLATFORMS.map((p) => (
                <PlatformChip
                  key={p.id}
                  label={p.label}
                  selected={selectedPlatforms.includes(p.id)}
                  onClick={() => togglePlatform(p.id)}
                />
              ))}
              <div
                style={{
                  marginTop: '8px',
                  borderTop: '1px solid #eee',
                  paddingTop: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: '#aaa',
                  letterSpacing: '0.06em',
                }}
              >
                {selectedPlatforms.length > 0 ? `${selectedPlatforms.length} PLATFORM${selectedPlatforms.length > 1 ? 'S' : ''} SELECTED` : 'No platform selected'}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div style={{ border: '1px solid #000' }}>
            <div
              style={{
                borderBottom: '1px solid #000',
                padding: '14px 20px',
                background: '#f5f5f5',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                TIMING
              </span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['now', 'schedule'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setScheduleMode(mode)}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    padding: '10px 14px',
                    border: scheduleMode === mode ? `2px solid ${C.indigo}` : '2px solid #ddd',
                    background: scheduleMode === mode ? C.indigoTint : 'transparent',
                    color: scheduleMode === mode ? C.indigo : '#555',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      border: `2px solid ${scheduleMode === mode ? C.indigo : '#ccc'}`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {scheduleMode === mode && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: C.indigo,
                          display: 'block',
                        }}
                      />
                    )}
                  </span>
                  {mode === 'now' ? 'Publish immediately' : 'Schedule for later'}
                </button>
              ))}

              {scheduleMode === 'schedule' && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        color: '#555',
                        marginBottom: '6px',
                      }}
                    >
                      DATE
                    </div>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      onFocus={() => setDateFocused(true)}
                      onBlur={() => setDateFocused(false)}
                      style={{
                        width: '100%',
                        border: `2px solid ${dateFocused ? C.indigo : '#000'}`,
                        background: dateFocused ? C.indigoTint : '#fafafa',
                        borderRadius: '2px',
                        padding: '9px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        color: '#000',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        color: '#555',
                        marginBottom: '6px',
                      }}
                    >
                      TIME (UTC)
                    </div>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      onFocus={() => setTimeFocused(true)}
                      onBlur={() => setTimeFocused(false)}
                      style={{
                        width: '100%',
                        border: `2px solid ${timeFocused ? C.indigo : '#000'}`,
                        background: timeFocused ? C.indigoTint : '#fafafa',
                        borderRadius: '2px',
                        padding: '9px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        color: '#000',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post preview summary */}
          <div style={{ border: '1px solid #000' }}>
            <div
              style={{
                borderBottom: '1px solid #000',
                padding: '14px 20px',
                background: '#f5f5f5',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                SUMMARY
              </span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  label: 'PLATFORMS',
                  value: selectedPlatforms.length
                    ? selectedPlatforms.length + ' selected'
                    : 'No platform selected',
                  color: selectedPlatforms.length ? C.indigo : '#ccc',
                },
                {
                  label: 'CAPTION',
                  value: caption.length ? caption.length + ' chars' : '— empty',
                  color: caption.length ? '#000' : '#ccc',
                },
                {
                  label: 'MEDIA',
                  value: file ? file.name.slice(0, 18) + (file.name.length > 18 ? '…' : '') : '— none',
                  color: file ? C.sage : '#ccc',
                },
                {
                  label: 'TIMING',
                  value: scheduleMode === 'now'
                    ? 'Immediately'
                    : scheduleDate && scheduleTime
                    ? scheduleDate + ' ' + scheduleTime
                    : '— not set',
                  color: scheduleMode === 'now' ? C.sage : scheduleDate ? C.amber : '#ccc',
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      color: '#aaa',
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 600,
                      color: row.color,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
