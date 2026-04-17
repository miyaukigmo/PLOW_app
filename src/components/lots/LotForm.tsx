import React, { useState } from 'react'

interface LotFormProps {
  onSubmit: (data: {
    lot_code: string
    batch_code: string | null
    distributed_date: string
    location: string
    distributed_count: number
    memo: string | null
  }) => Promise<void>
  onCancel: () => void
  loading?: boolean
  nextNumber: number
}

const LotForm: React.FC<LotFormProps> = ({ onSubmit, onCancel, loading, nextNumber }) => {
  const defaultLotCode = `LOT-${String(nextNumber).padStart(3, '0')}`
  const [lotCode, setLotCode] = useState(defaultLotCode)
  const [batchCode, setBatchCode] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [count, setCount] = useState<number | ''>('')
  const [memo, setMemo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lotCode.trim() || !date || !location.trim() || count === '') return

    await onSubmit({
      lot_code: lotCode.trim(),
      batch_code: batchCode.trim() || null,
      distributed_date: date,
      location: location.trim(),
      distributed_count: Number(count),
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>ロットID</label>
          <input
            style={inputStyle}
            value={lotCode}
            onChange={(e) => setLotCode(e.target.value)}
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
          />
        </div>
        <div>
          <label style={labelStyle}>バッチコード（任意）</label>
          <input
            style={inputStyle}
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
            placeholder="例：#MK-0601"
            onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>配布日</label>
          <input
            type="date"
            style={inputStyle}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
          />
        </div>
        <div>
          <label style={labelStyle}>配布数</label>
          <input
            type="number"
            style={inputStyle}
            value={count}
            onChange={(e) => setCount(e.target.value === '' ? '' : Number(e.target.value))}
            min="1"
            placeholder="例：500"
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>場所</label>
        <input
          style={inputStyle}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="例：三国駅前、三国中 門前"
          required
          onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
        />
      </div>

      <div>
        <label style={labelStyle}>メモ（任意）</label>
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="天気・時間帯など"
          onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
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
          disabled={loading || !lotCode.trim() || !date || !location.trim() || count === ''}
          style={{
            padding: '12px 32px',
            border: '1px solid #00FF41',
            background: loading ? 'transparent' : '#00FF41',
            color: loading ? '#00FF41' : '#161616',
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

export default LotForm
