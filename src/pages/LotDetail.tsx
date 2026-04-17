import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Lot } from '../types'
import { useToast } from '../components/ui/Toast'
import { format, parseISO } from 'date-fns'
import { CaretLeft, ChartLineUp } from '@phosphor-icons/react'

const LotDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [lot, setLot] = useState<Lot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 効果記録用ステート
  const [answerCount, setAnswerCount] = useState<string>('')
  const [lineCount, setLineCount] = useState<string>('')
  const [visitCount, setVisitCount] = useState<string>('')
  const [visitMemo, setVisitMemo] = useState<string>('')

  const fetchLot = async () => {
    if (!id) return
    const { data, error } = await supabase.from('lots').select('*').eq('id', id).single()
    if (error) {
      showToast('ロットデータの取得に失敗しました', 'error')
      navigate('/lots')
    } else {
      setLot(data)
      setAnswerCount(data.answer_box_count?.toString() ?? '')
      setLineCount(data.line_register_count?.toString() ?? '')
      setVisitCount(data.visit_count?.toString() ?? '')
      setVisitMemo(data.visit_memo ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLot()
  }, [id])

  const handleUpdateEffects = async () => {
    if (!id || !lot) return
    setSaving(true)
    
    const updates = {
      answer_box_count: answerCount === '' ? null : Number(answerCount),
      line_register_count: lineCount === '' ? null : Number(lineCount),
      visit_count: visitCount === '' ? null : Number(visitCount),
      visit_memo: visitMemo.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('lots').update(updates).eq('id', id)
    setSaving(false)
    
    if (error) {
      showToast('更新に失敗しました', 'error')
    } else {
      showToast('効果記録を更新しました')
      fetchLot()
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm('本当にこのロット記録を削除しますか？\n（関連する効果記録もすべて消去されます）')) return
    
    const { error } = await supabase.from('lots').delete().eq('id', id)
    if (error) {
      showToast('削除に失敗しました', 'error')
    } else {
      showToast('ロット記録を削除しました')
      navigate('/lots')
    }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#888888', letterSpacing: '0.1em', fontSize: '13px' }}>読み込み中...</div>
  if (!lot) return null

  // 率の計算
  const calcRate = (count: number | null) => {
    if (count == null || !lot.distributed_count) return null
    return ((count / lot.distributed_count) * 100).toFixed(1)
  }

  const answerRate = calcRate(lot.answer_box_count)
  const visitRate = calcRate(lot.visit_count)

  const cardStyle: React.CSSProperties = {
    background: '#222222',
    border: '1px solid #333333',
    padding: '32px',
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
    <div style={{ padding: '48px 32px', maxWidth: '1000px' }}>
      <button
        onClick={() => navigate('/lots')}
        style={{
          background: 'none',
          border: 'none',
          color: '#888888',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E6E6')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
      >
        <CaretLeft weight="bold" /> ロット一覧へ戻る
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'flex-start' }}>
        {/* 左側: 効果記録フォーム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <ChartLineUp weight="duotone" size={28} color="#00FF41" />
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>効果記録を更新</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>解答BOX回収数</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      style={inputStyle}
                      value={answerCount}
                      onChange={(e) => setAnswerCount(e.target.value)}
                      placeholder="例: 50"
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888888', fontSize: '12px', letterSpacing: '0.05em' }}>枚</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>LINE登録者数</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      style={inputStyle}
                      value={lineCount}
                      onChange={(e) => setLineCount(e.target.value)}
                      placeholder="例: 10"
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888888', fontSize: '12px', letterSpacing: '0.05em' }}>人</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>来塾者数</label>
                <div style={{ position: 'relative', width: '50%' }}>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    value={visitCount}
                    onChange={(e) => setVisitCount(e.target.value)}
                    placeholder="例: 2"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888888', fontSize: '12px', letterSpacing: '0.05em' }}>人</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>来塾者メモ</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  value={visitMemo}
                  onChange={(e) => setVisitMemo(e.target.value)}
                  placeholder="来塾者の属性や、面談の感触など"
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#00FF41')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
                />
              </div>

              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={handleUpdateEffects}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'transparent',
                    border: '1px solid #00FF41',
                    color: '#00FF41',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = '#00FF41'
                      e.currentTarget.style.color = '#161616'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#00FF41'
                    }
                  }}
                >
                  {saving ? '保存中...' : '効果記録を保存'}
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <button
               onClick={handleDelete}
               style={{
                 background: 'none',
                 border: 'none',
                 color: '#EF4444',
                 fontSize: '11px',
                 fontWeight: 600,
                 cursor: 'pointer',
                 textDecoration: 'underline',
                 letterSpacing: '0.05em'
               }}
            >
              このロットを削除する
            </button>
          </div>
        </div>

        {/* 右側: ロット詳細情報 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ ...cardStyle, background: 'transparent', border: '1px solid #00FF41' }}>
            <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', letterSpacing: '0.05em' }}>ロットID</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
              {lot.lot_code}
              {lot.batch_code && <span style={{ fontSize: '11px', border: '1px solid #333333', padding: '4px 12px', color: '#888888', letterSpacing: '0.05em' }}>{lot.batch_code}</span>}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid #333333', marginBottom: '24px' }}>
               <div>
                  <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', letterSpacing: '0.05em' }}>配布日</div>
                  <div style={{ fontWeight: 500, letterSpacing: '0.05em' }}>{format(parseISO(lot.distributed_date), 'yyyy.MM.dd')}</div>
               </div>
               <div>
                  <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', letterSpacing: '0.05em' }}>場所</div>
                  <div style={{ fontWeight: 500 }}>{lot.location}</div>
               </div>
            </div>

            <div style={{ textAlign: 'left' }}>
               <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', letterSpacing: '0.05em' }}>総配布数</div>
               <div style={{ fontSize: '36px', fontWeight: 300, fontFamily: 'sans-serif', color: '#00FF41' }}>
                  {lot.distributed_count.toLocaleString()} <span style={{ fontSize: '14px', color: '#888888' }}>部</span>
               </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#E6E6E6', fontWeight: 700, letterSpacing: '0.05em' }}>効果サマリー</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #333333' }}>
                <span style={{ fontSize: '11px', color: '#888888', letterSpacing: '0.05em' }}>回収率</span>
                <span style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'sans-serif', color: answerRate && Number(answerRate) >= 5 ? '#10B981' : '#E6E6E6' }}>
                  {answerRate ? `${answerRate}%` : '-'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#888888', letterSpacing: '0.05em' }}>来塾率</span>
                <span style={{ fontSize: '20px', fontWeight: 500, fontFamily: 'sans-serif', color: '#E6E6E6' }}>
                  {visitRate ? `${visitRate}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          {lot.memo && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#888888', letterSpacing: '0.05em' }}>メモ</h3>
              <div style={{ fontSize: '13px', color: '#E6E6E6', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {lot.memo}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default LotDetail
