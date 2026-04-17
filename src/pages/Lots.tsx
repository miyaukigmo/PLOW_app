import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Lot } from '../types'
import Modal from '../components/ui/Modal'
import LotForm from '../components/lots/LotForm'
import { useToast } from '../components/ui/Toast'
import { format, parseISO } from 'date-fns'
import { Plus, Package, CaretRight } from '@phosphor-icons/react'

const Lots: React.FC = () => {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchLots = async () => {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('distributed_date', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) {
      showToast('ロットデータの取得に失敗しました', 'error')
    } else {
      setLots(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLots()
  }, [])

  const handleCreate = async (data: any) => {
    setSaving(true)
    const { error } = await supabase.from('lots').insert([data])
    setSaving(false)
    if (error) {
      showToast('登録に失敗しました', 'error')
    } else {
      showToast('配布ロットを登録しました')
      setModalOpen(false)
      fetchLots()
    }
  }

  const thStyle: React.CSSProperties = {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    borderBottom: '1px solid #333333',
    background: '#1a1a1a',
    whiteSpace: 'nowrap',
    letterSpacing: '0.05em',
  }

  const tdStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '14px',
    color: '#E6E6E6',
    borderBottom: '1px solid #2a2a2a',
  }

  const nextNumber = lots.length > 0 
    ? Math.max(...lots.map(l => parseInt(l.lot_code.replace('LOT-', '')) || 0)) + 1 
    : 1

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderLeft: '4px solid #00FF41', paddingLeft: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>配布ロット管理</h1>
          <p style={{ margin: '4px 0 0', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
            全 {lots.length} 件の記録
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'transparent',
            color: '#00FF41',
            border: '1px solid #00FF41',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00FF41'
            e.currentTarget.style.color = '#161616'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#00FF41'
          }}
        >
          <Plus weight="bold" size={16} /> 新規ロット登録
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888888', letterSpacing: '0.1em', fontSize: '13px' }}>読み込み中...</div>
      ) : lots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px',
          background: '#222222',
          border: '1px solid #333333',
          color: '#888888',
        }}>
          <Package weight="duotone" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div style={{ fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em', color: '#E6E6E6' }}>配布ロットがありません</div>
          <div style={{ fontSize: '13px', letterSpacing: '0.05em' }}>「+ 新規ロット登録」から記録を始めましょう。</div>
        </div>
      ) : (
        <div style={{ background: '#222222', border: '1px solid #333333' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ロットID</th>
                  <th style={thStyle}>配布日</th>
                  <th style={thStyle}>場所</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>配布数</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>回収率</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>来塾率</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => {
                  const answerRate = lot.answer_box_count != null ? ((lot.answer_box_count / lot.distributed_count) * 100).toFixed(1) : '-'
                  const visitRate = lot.visit_count != null ? ((lot.visit_count / lot.distributed_count) * 100).toFixed(1) : '-'
                  
                  return (
                    <tr 
                      key={lot.id} 
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={tdStyle}>
                        <Link to={`/lots/${lot.id}`} style={{ fontWeight: 600, color: '#E6E6E6', textDecoration: 'none', letterSpacing: '0.05em' }}>
                          {lot.lot_code}
                        </Link>
                        {lot.batch_code && <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px', letterSpacing: '0.05em' }}>{lot.batch_code}</div>}
                      </td>
                      <td style={{ ...tdStyle, letterSpacing: '0.05em', fontWeight: 500 }}>
                        {format(parseISO(lot.distributed_date), 'yyyy.MM.dd')}
                      </td>
                      <td style={tdStyle}>{lot.location}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, fontFamily: 'sans-serif' }}>{lot.distributed_count.toLocaleString()}</td>
                      
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {lot.answer_box_count != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <span style={{ fontWeight: 500, fontFamily: 'sans-serif' }}>{lot.answer_box_count.toLocaleString()}</span>
                            <span style={{ fontSize: '11px', color: '#10B981', border: '1px solid #10B981', padding: '2px 8px', letterSpacing: '0.05em' }}>{answerRate}%</span>
                          </div>
                        ) : <span style={{ color: '#333333' }}>-</span>}
                      </td>
                      
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {lot.visit_count != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                            <span style={{ fontWeight: 500, fontFamily: 'sans-serif' }}>{lot.visit_count.toLocaleString()}</span>
                            <span style={{ fontSize: '11px', color: '#10B981', border: '1px solid #10B981', padding: '2px 8px', letterSpacing: '0.05em' }}>{visitRate}%</span>
                          </div>
                        ) : <span style={{ color: '#333333' }}>-</span>}
                      </td>
                      
                      <td style={{ ...tdStyle, textAlign: 'right', width: '80px' }}>
                        <Link to={`/lots/${lot.id}`} style={{ color: '#888888', textDecoration: 'none', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', letterSpacing: '0.05em' }}>
                          詳細 <CaretRight weight="bold" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="新規ロット登録">
        <LotForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
          nextNumber={nextNumber}
        />
      </Modal>
    </div>
  )
}

export default Lots
