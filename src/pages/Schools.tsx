import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { School, SchoolType } from '../types'
import { SchoolTypeBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import SchoolForm from '../components/schools/SchoolForm'
import { useToast } from '../components/ui/Toast'
import { format, differenceInDays } from 'date-fns'
import { CaretRight, Plus, Buildings } from '@phosphor-icons/react'

const Schools: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchSchools = async () => {
    const { data, error } = await supabase.from('schools').select('*').order('type').order('name')
    if (error) {
      showToast('学校データの取得に失敗しました', 'error')
    } else {
      setSchools(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleCreate = async (data: any) => {
    setSaving(true)
    const { error } = await supabase.from('schools').insert([data])
    setSaving(false)
    if (error) {
      showToast('登録に失敗しました', 'error')
    } else {
      showToast('学校を登録しました')
      setModalOpen(false)
      fetchSchools()
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
    letterSpacing: '0.05em',
  }

  const tdStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '14px',
    color: '#E6E6E6',
    borderBottom: '1px solid #2a2a2a',
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderLeft: '4px solid #FF5E00', paddingLeft: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>学校管理</h1>
          <p style={{ margin: '4px 0 0', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
            全 {schools.length} 校
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
            color: '#FF5E00',
            border: '1px solid #FF5E00',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FF5E00'
            e.currentTarget.style.color = '#161616'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#FF5E00'
          }}
        >
          <Plus weight="bold" size={16} /> 学校を追加
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888888', letterSpacing: '0.1em', fontSize: '13px' }}>読み込み中...</div>
      ) : schools.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px',
          background: '#222222',
          border: '1px solid #333333',
          color: '#888888',
        }}>
          <Buildings weight="duotone" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div style={{ fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em', color: '#E6E6E6' }}>登録されている学校がありません</div>
          <div style={{ fontSize: '13px', letterSpacing: '0.05em' }}>「学校を追加」から登録を始めてください。</div>
        </div>
      ) : (
        <div style={{ background: '#222222', border: '1px solid #333333' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>学校名</th>
                <th style={thStyle}>種別</th>
                <th style={thStyle}>最終更新日</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => {
                const daysSinceUpdate = differenceInDays(new Date(), new Date(school.updated_at))
                const needsUpdate = daysSinceUpdate >= 30
                
                return (
                  <tr 
                    key={school.id} 
                    style={{ transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      <Link to={`/schools/${school.id}`} style={{ color: '#E6E6E6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         {school.name}
                      </Link>
                    </td>
                    <td style={tdStyle}>
                      <SchoolTypeBadge type={school.type} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#888888', letterSpacing: '0.05em' }}>
                          {format(new Date(school.updated_at), 'yyyy.MM.dd')}
                        </span>
                        {needsUpdate && (
                          <span style={{ fontSize: '11px', color: '#EF4444', border: '1px solid #EF4444', padding: '2px 6px', fontWeight: 600, letterSpacing: '0.05em' }}>
                            {daysSinceUpdate}日
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '80px' }}>
                      <Link to={`/schools/${school.id}`} style={{ color: '#888888', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '12px', letterSpacing: '0.05em', fontWeight: 600 }}>
                        詳細 <CaretRight weight="bold" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="学校情報を追加">
        <SchoolForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}

export default Schools
