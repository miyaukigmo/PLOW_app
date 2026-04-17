import React, { useState } from 'react'
import type { SchoolEvent } from '../../types'
import { useCategories } from '../../hooks/useCategories'

interface EventFormProps {
  initial?: Partial<SchoolEvent>
  onSubmit: (data: {
    name: string
    category: string
    date_start: string
    date_end: string | null
    is_confirmed: boolean
    memo: string | null
  }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const EventForm: React.FC<EventFormProps> = ({ initial, onSubmit, onCancel, loading }) => {
  const { categories, loading: categoriesLoading } = useCategories()
  
  const [name, setName] = useState(initial?.name || '')
  // もしinitialがあればそれを、なければ一番最初のカテゴリをデフォルトにする
  const [category, setCategory] = useState<string>(initial?.category || '')
  const [dateStart, setDateStart] = useState(initial?.date_start || new Date().toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(initial?.date_end || '')
  const [isConfirmed, setIsConfirmed] = useState(initial?.is_confirmed ?? true)
  const [memo, setMemo] = useState(initial?.memo || '')

  // カテゴリロード時に初期値が存在しなければセット
  React.useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].id)
    }
  }, [categories, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !dateStart || !category) return

    await onSubmit({
      name: name.trim(),
      category,
      date_start: dateStart,
      date_end: dateEnd || null,
      is_confirmed: isConfirmed,
      memo: memo.trim() || null,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #333333',
    background: '#161616',
    color: '#E6E6E6',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    marginBottom: '8px',
    letterSpacing: '0.05em',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={labelStyle}>イベント名</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：1学期 中間テスト"
          required
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>種別</label>
          {categoriesLoading ? (
            <div style={{ ...inputStyle, color: '#888888' }}>読込中...</div>
          ) : (
            <select
              style={inputStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label style={labelStyle}>状態</label>
          <div style={{ display: 'flex', alignItems: 'center', height: '44px', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E6E6E6', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={isConfirmed}
                onChange={() => setIsConfirmed(true)}
                style={{ accentColor: '#FF5E00' }}
              />
              確定
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E6E6E6', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={!isConfirmed}
                onChange={() => setIsConfirmed(false)}
                style={{ accentColor: '#FF5E00' }}
              />
              未確定（予定）
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>開始日</label>
          <input
            type="date"
            style={inputStyle}
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
          />
        </div>
        <div>
          <label style={labelStyle}>終了日（任意）</label>
          <input
            type="date"
            style={inputStyle}
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>メモ（任意）</label>
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="テスト範囲や備考など"
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            border: '1px solid #333333',
            background: 'transparent',
            color: '#888888',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#E6E6E6'; e.currentTarget.style.borderColor = '#888888' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#888888'; e.currentTarget.style.borderColor = '#333333' }}
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim() || !dateStart}
          style={{
            padding: '12px 32px',
            border: '1px solid #FF5E00',
            background: loading ? 'transparent' : '#FF5E00',
            color: loading ? '#FF5E00' : '#161616',
            fontSize: '12px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          {loading ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  )
}

export default EventForm
