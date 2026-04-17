import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { School, SchoolEvent } from '../types'
import { SchoolTypeBadge, CategoryBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EventForm from '../components/events/EventForm'
import SchoolForm from '../components/schools/SchoolForm'
import { useToast } from '../components/ui/Toast'
import { format, parseISO, subWeeks } from 'date-fns'
import { CaretLeft, Plus, PencilSimple, CalendarBlank, Warning } from '@phosphor-icons/react'

const SchoolDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [school, setSchool] = useState<School | null>(null)
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)

  // モーダル制御
  const [schoolModalOpen, setSchoolModalOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentTab, setCurrentTab] = useState<'all' | 'test' | 'other'>('all')
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | undefined>(undefined)

  const fetchData = async () => {
    if (!id) return
    const [schoolRes, eventsRes] = await Promise.all([
      supabase.from('schools').select('*').eq('id', id).single(),
      supabase.from('events').select('*').eq('school_id', id).order('date_start', { ascending: true }),
    ])

    if (schoolRes.error) {
      showToast('学校が見つかりませんでした', 'error')
      navigate('/schools')
      return
    }

    setSchool(schoolRes.data)
    setEvents(eventsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  // ==========================================
  // ハンドラー (テスト対策自動生成)
  // ==========================================
  const syncPrepEvents = async (parentEvent: SchoolEvent) => {
    // 既存の紐づく対策イベントをまず削除
    await supabase.from('events').delete().eq('parent_event_id', parentEvent.id)
    
    // カテゴリが「test」の場合のみ生成
    if (parentEvent.category !== 'test') return

    const baseDate = parseISO(parentEvent.date_start)
    const prepEvents = [
      { weeksBefore: 1, label: '1週間前' },
      { weeksBefore: 2, label: '2週間前' },
      { weeksBefore: 3, label: '3週間前' },
    ].map(p => {
      const prepDate = subWeeks(baseDate, p.weeksBefore)
      
      return {
        school_id: parentEvent.school_id,
        parent_event_id: parentEvent.id,
        name: `${parentEvent.name} ${p.label}！`,
        category: 'test_prep',
        date_start: format(prepDate, 'yyyy-MM-dd'),
        date_end: null,
        is_confirmed: parentEvent.is_confirmed,
        memo: `自動生成された${p.label}の対策スケジュール`,
      }
    })

    const { error } = await supabase.from('events').insert(prepEvents)
    if (error) console.error('テスト対策の生成に失敗しました:', error)
  }

  const handleUpdateSchool = async (data: any) => {
    if (!id) return
    setSaving(true)
    const { error } = await supabase
      .from('schools')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    setSaving(false)
    if (error) {
      showToast('更新に失敗しました', 'error')
    } else {
      showToast('学校情報を更新しました')
      setSchoolModalOpen(false)
      fetchData()
    }
  }

  const handleDeleteSchool = async () => {
    if (!id) return
    if (!window.confirm('本当に削除しますか？\n（関連するイベントもすべて削除されます）')) return
    
    const { error } = await supabase.from('schools').delete().eq('id', id)
    if (error) {
      showToast('削除に失敗しました', 'error')
    } else {
      showToast('学校を削除しました')
      navigate('/schools')
    }
  }

  const handleSaveEvent = async (data: any) => {
    if (!id) return
    setSaving(true)

    let error
    let savedEvent: SchoolEvent | null = null

    if (editingEvent) {
      const res = await supabase
        .from('events')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingEvent.id)
        .select()
        .single()
      error = res.error
      savedEvent = res.data
    } else {
      const res = await supabase
        .from('events')
        .insert([{ ...data, school_id: id }])
        .select()
        .single()
      error = res.error
      savedEvent = res.data
      // 学校自体の更新日時も更新する
      await supabase.from('schools').update({ updated_at: new Date().toISOString() }).eq('id', id)
    }

    // テスト対策イベントの同期
    if (savedEvent) {
      await syncPrepEvents(savedEvent)
    }

    setSaving(false)
    if (error) {
      showToast('保存に失敗しました', 'error')
    } else {
      showToast(editingEvent ? 'イベントを更新しました' : 'イベントを追加しました')
      setEventModalOpen(false)
      setEditingEvent(undefined)
      fetchData()
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('このイベントを削除しますか？\n（テストの場合は対策スケジュールも削除されます）')) return
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) {
      showToast('削除に失敗しました', 'error')
    } else {
      showToast('イベントを削除しました')
      fetchData()
    }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#888888', letterSpacing: '0.1em', fontSize: '13px' }}>読み込み中...</div>
  if (!school) return null

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

  const filteredEvents = events.filter(ev => {
    if (currentTab === 'test') return ev.category === 'test' || ev.category === 'test_prep'
    if (currentTab === 'other') return ev.category !== 'test' && ev.category !== 'test_prep'
    return true
  })

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1000px' }}>
      <button
        onClick={() => navigate('/schools')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#888888',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E6E6')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
      >
        <CaretLeft weight="bold" /> 学校一覧へ戻る
      </button>

      {/* 学校ヘッダー情報 */}
      <div style={{ 
        background: '#222222', 
        border: '1px solid #FF5E00', 
        padding: '32px', 
        marginBottom: '40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <SchoolTypeBadge type={school.type} />
              <span style={{ fontSize: '11px', color: '#888888', letterSpacing: '0.05em' }}>
                最終更新日時: {format(parseISO(school.updated_at), 'yyyy.MM.dd')}
              </span>
            </div>
            <h1 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>
              {school.name}
            </h1>
            {school.memo && (
              <p style={{ margin: 0, color: '#888888', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {school.memo}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            <button
               onClick={() => setSchoolModalOpen(true)}
               style={{
                 background: 'transparent',
                 border: '1px solid #333333',
                 color: '#E6E6E6',
                 padding: '8px 16px',
                 fontSize: '11px',
                 fontWeight: 600,
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px',
                 letterSpacing: '0.05em',
               }}
               onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#888888')}
               onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333333')}
            >
              <PencilSimple weight="bold" /> 編集 
            </button>
            <button
               onClick={handleDeleteSchool}
               style={{
                 background: 'transparent',
                 border: 'transparent',
                 color: '#EF4444',
                 padding: '4px',
                 fontSize: '11px',
                 cursor: 'pointer',
                 textDecoration: 'underline',
               }}
            >
              削除
            </button>
          </div>
        </div>
      </div>

      {/* イベント一覧部分 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { id: 'all', label: 'すべて' },
              { id: 'test', label: 'テスト日程' },
              { id: 'other', label: 'その他' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: currentTab === tab.id ? '2px solid #FF5E00' : '2px solid transparent',
                  color: currentTab === tab.id ? '#E6E6E6' : '#888888',
                  padding: '8px 4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => {
              setEditingEvent(undefined)
              setEventModalOpen(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: 'transparent',
              color: '#FF5E00',
              border: '1px solid #FF5E00',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
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
            <Plus weight="bold" /> イベントを追加
          </button>
        </div>

        {filteredEvents.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '60px', background: '#222222', border: '1px solid #333333', color: '#888888' }}>
             <CalendarBlank weight="duotone" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
             <div style={{ fontSize: '13px', letterSpacing: '0.05em' }}>予定されているイベントがありません。</div>
           </div>
        ) : (
          <div style={{ background: '#222222', border: '1px solid #333333' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>日程</th>
                  <th style={thStyle}>種別</th>
                  <th style={thStyle}>イベント名・メモ</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => (
                  <tr 
                    key={ev.id}
                    style={{ transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 500, letterSpacing: '0.05em' }}>
                        {format(parseISO(ev.date_start), 'yyyy.MM.dd')}
                      </div>
                      {ev.date_end && (
                        <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px', letterSpacing: '0.05em' }}>
                          〜 {format(parseISO(ev.date_end), 'MM.dd')}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, verticalAlign: 'top' }}>
                      <CategoryBadge category={ev.category} unconfirmed={!ev.is_confirmed} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, marginBottom: ev.memo ? '6px' : '0' }}>
                        {ev.name}
                        {!ev.is_confirmed && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Warning weight="fill" /> (予定)
                          </span>
                        )}
                      </div>
                      {ev.memo && <div style={{ fontSize: '12px', color: '#888888', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{ev.memo}</div>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <button
                        onClick={() => {
                          setEditingEvent(ev)
                          setEventModalOpen(true)
                        }}
                        style={{ background: 'none', border: 'none', color: '#888888', fontSize: '11px', fontWeight: 600, cursor: 'pointer', marginRight: '16px', letterSpacing: '0.05em' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E6E6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.05em' }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* サブモーダル群 */}
      <Modal isOpen={schoolModalOpen} onClose={() => setSchoolModalOpen(false)} title="学校情報を編集">
        <SchoolForm
          initial={school}
          onSubmit={handleUpdateSchool}
          onCancel={() => setSchoolModalOpen(false)}
          loading={saving}
        />
      </Modal>

      <Modal isOpen={eventModalOpen} onClose={() => { setEventModalOpen(false); setEditingEvent(undefined); }} title={editingEvent ? "イベントを編集" : "イベントを追加"}>
        <EventForm
          initial={editingEvent}
          onSubmit={handleSaveEvent}
          onCancel={() => { setEventModalOpen(false); setEditingEvent(undefined); }}
          loading={saving}
        />
      </Modal>
    </div>
  )
}

export default SchoolDetail
