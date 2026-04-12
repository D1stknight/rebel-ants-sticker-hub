'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all existing tags once
  useEffect(() => {
    createClient()
      .from('asset_tags')
      .select('tag')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((d: { tag: string }) => d.tag))].sort()
          setAllTags(unique)
        }
      })
  }, [])

  // Filter suggestions as user types
  useEffect(() => {
    const q = input.replace(/^#/, '').trim().toLowerCase()
    if (!q) { setSuggestions([]); return }
    const filtered = allTags.filter(t =>
      t.toLowerCase().includes(q) && !value.includes(t)
    ).slice(0, 8)
    setSuggestions(filtered)
  }, [input, allTags, value])

  const addTag = (tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase()
    if (!clean || value.includes(clean)) return
    onChange([...value, clean])
    setInput('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length > 0 && input.length > 0) {
        addTag(suggestions[0])
      } else if (input.trim()) {
        addTag(input)
      }
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Tag chips + input */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '8px 12px', cursor: 'text', minHeight: 44,
        }}
      >
        {value.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            color: 'var(--accent-purple)', borderRadius: 8,
            padding: '2px 8px', fontSize: 12, fontWeight: 600,
          }}>
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-purple)', padding: 0, lineHeight: 1, fontSize: 14 }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={value.length === 0 ? 'Type a tag and press Enter or comma…' : ''}
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: 13, flex: 1, minWidth: 140,
            padding: '2px 0',
          }}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, marginTop: 4, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onMouseDown={() => addTag(tag)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ color: 'var(--accent-purple)', marginRight: 6 }}>#</span>{tag}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
        Press Enter or comma to add · Backspace to remove · No # needed
      </p>
    </div>
  )
}
