'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadDropzoneProps {
  accept: Record<string, string[]>
  onFile: (file: File) => void
  label?: string
  preview?: string
  loading?: boolean
}

export default function UploadDropzone({ accept, onFile, label, preview, loading }: UploadDropzoneProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return
    onFile(accepted[0])
    const url = URL.createObjectURL(accepted[0])
    setLocalPreview(url)
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
  })

  const displayPreview = localPreview || preview

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--accent-purple)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? 'rgba(139,92,246,0.05)' : 'var(--bg-surface)',
        transition: 'border-color 0.15s, background 0.15s',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        position: 'relative',
      }}
    >
      <input {...getInputProps()} />

      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 14 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      )}

      {displayPreview ? (
        <img
          src={displayPreview}
          alt="Preview"
          style={{ maxWidth: 120, maxHeight: 120, objectFit: 'contain', borderRadius: 8 }}
        />
      ) : (
        <>
          <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              {isDragActive ? 'Drop it!' : (label ?? 'Drop file or click to browse')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {Object.values(accept).flat().join(', ')}
            </p>
          </div>
        </>
      )}

      {displayPreview && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Click to replace</p>
      )}
    </div>
  )
}
