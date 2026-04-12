'use client'

import { useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search stickers, GIFs, packs…' }: SearchBarProps) {
  const debounced = useDebouncedCallback((val: string) => onChange(val), 300)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debounced(e.target.value)
  }, [debounced])

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="16" height="16"
        fill="none" stroke="currentColor" strokeWidth={2}
        style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }}
      >
        <circle cx="7" cy="7" r="5"/>
        <path d="M14 14l-3-3" strokeLinecap="round"/>
      </svg>
      <input
        type="search"
        className="input"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ paddingLeft: 40 }}
      />
    </div>
  )
}
