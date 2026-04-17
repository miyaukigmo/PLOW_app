import React, { useState } from 'react'
import { SCHOOL_TYPE_LABELS, type School, type SchoolType } from '../../types'

interface SchoolFormProps {
  initial?: Partial<School>
  onSubmit: (data: { name: string; type: SchoolType; memo: string | null }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const SchoolForm: React.FC<SchoolFormProps> = ({ initial, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState<SchoolType>(initial?.type || 'junior_high')
  const [memo, setMemo] = useState(initial?.memo || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSubmit({
      name: name.trim(),
      type,
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
        <label style={labelStyle}>学校名</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：三国中学校"
          required
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
        />
      </div>

      <div>
        <label style={labelStyle}>種別</label>
        <select
          style={inputStyle}
          value={type}
          onChange={(e) => setType(e.target.value as SchoolType)}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5E00')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
        >
          {Object.entries(SCHOOL_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>メモ（任意）</label>
        <textarea
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="対象学年・担当者など自由記述"
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
          disabled={loading || !name.trim()}
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

export default SchoolForm
