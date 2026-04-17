import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SchoolEvent } from '../types'
import { CategoryBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EventForm from '../components/events/EventForm'
import { useToast } from '../components/ui/Toast'
import { format, parseISO } from 'date-fns'
import { Plus, Flag, Warning } from '@phosphor-icons/react'

const GlobalEvents: React.FC = () => {
  const { showToast } = useToast()

  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | undefined>(undefined)

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .is('school_id', null)
      .order('date_start', { ascending: true })

    if (error) {
      showToast('共通イベントの取得に失敗しました', 'error')
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSaveEvent = async (data: any) => {
    setSaving(true)

    let error
    if (editingEvent) {
      const res = await supabase
        .from('events')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingEvent.id)
      error = res.error
    } else {
      const res = await supabase
        .from('events')
        .insert([{ ...data, school_id: null }])
      error = res.error
    }

    setSaving(false)
    if (error) {
      showToast('保存に失敗しました', 'error')
    } else {
      showToast(editingEvent ? '共通イベントを更新しました' : '共通イベントを追加しました')
      setEventModalOpen(false)
      setEditingEvent(undefined)
      fetchEvents()
    }
  }

  const handleImportHolidays = async () => {
    if (!window.confirm('2025年以降の日本の祝日を自動取得して追加しますか？\n（すでに登録済みの祝日がある場合は重複する可能性があります）')) return

    setLoading(true)
    try {
      const res = await fetch('https://holidays-jp.github.io/api/v1/date.json')
      const data: Record<string, string> = await res.json()
      
      const inserts = Object.entries(data).map(([dateStr, name]) => {
        return {
          school_id: null,
          name: name,
          category: 'holiday',
          date_start: dateStr,
          date_end: null,
          is_confirmed: true,
          memo: '自動インポートされた祝日',
        }
      })

      // 2025年以降のデータだけフィルタするなどの処理を入れるのもあり。ここでは全部入れる。
      // すでにある同名のイベントとの重複チェック
      const existingRes = await supabase.from('events').select('date_start').is('school_id', null).eq('category', 'holiday')
      const existingDates = new Set((existingRes.data || []).map(e => e.date_start))
      
      const newInserts = inserts.filter(i => !existingDates.has(i.date_start))

      if (newInserts.length === 0) {
        showToast('新しい祝日はありませんでした')
      } else {
        const { error } = await supabase.from('events').insert(newInserts)
        if (error) throw error
        showToast(`${newInserts.length}件の祝日を追加しました`)
      }
    } catch (err) {
      console.error(err)
      showToast('祝日のインポートに失敗しました', 'error')
    }
    
    await fetchEvents()
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('この共通イベントを削除しますか？')) return
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) {
      showToast('削除に失敗しました', 'error')
    } else {
      showToast('共通イベントを削除しました')
      fetchEvents()
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
    <div style={{ padding: '48px 32px', maxWidth: '1000px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderLeft: '4px solid #ef4444', paddingLeft: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>共通イベント管理</h1>
          <p style={{ margin: '4px 0 0', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
            すべての学校のカレンダーに表示されるイベント（国民の祝日など）を管理します。
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={handleImportHolidays}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#888888',
              border: '1px solid #333333',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E6E6E6'; e.currentTarget.style.borderColor = '#888888' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888888'; e.currentTarget.style.borderColor = '#333333' }}
          >
            日本の祝日を自動取得
          </button>
          
          <button
            onClick={() => {
              setEditingEvent(undefined)
              setEventModalOpen(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444'
              e.currentTarget.style.color = '#161616'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#ef4444'
            }}
          >
            <Plus weight="bold" size={16} /> 共通イベントを追加
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888888', letterSpacing: '0.1em', fontSize: '13px' }}>読み込み中...</div>
      ) : events.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '80px', background: '#222222', border: '1px solid #333333', color: '#888888' }}>
             <Flag weight="duotone" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
             <div style={{ fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em', color: '#E6E6E6' }}>登録されている共通イベントがありません</div>
             <div style={{ fontSize: '13px', letterSpacing: '0.05em' }}>「+ 共通イベントを追加」ボタンから登録を始めてください。</div>
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
                {events.map((ev) => (
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

      <Modal isOpen={eventModalOpen} onClose={() => { setEventModalOpen(false); setEditingEvent(undefined); }} title={editingEvent ? "共通イベントを編集" : "共通イベントを追加"}>
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

export default GlobalEvents
