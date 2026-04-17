import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { type School, type SchoolEvent } from '../types'
import { drawCalendar, type CalendarConfig } from '../components/calendar/CalendarEngine'
import { useToast } from '../components/ui/Toast'
import { useCategories } from '../hooks/useCategories'
import { DownloadSimple, ImageSquare } from '@phosphor-icons/react'
import { addMonths, endOfMonth } from 'date-fns'

const generateMonths = () => {
  const months = []
  const current = new Date()
  for (let i = -1; i <= 6; i++) {
    const d = new Date(current.getFullYear(), current.getMonth() + i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return months
}

const CalendarOutput: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([])
  const [events, setEvents] = useState<SchoolEvent[]>([])

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}`
  })
  const [includeHoliday, setIncludeHoliday] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { showToast } = useToast()
  const { categories } = useCategories()

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('schools').select('*').order('name')
      if (data) {
        setSchools(data)
        if (data.length > 0) setSelectedSchoolId(data[0].id)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedSchoolId) return

      const [y, m] = selectedMonth.split('-').map(Number)
      // 開始月の1日
      const startOfRange = new Date(y, m - 1, 1).toISOString().split('T')[0]
      // 翌月末日
      const nextMonth = addMonths(new Date(y, m - 1, 1), 1)
      const endOfRange = endOfMonth(nextMonth).toISOString().split('T')[0]

      const [schoolEventsRes, globalEventsRes] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('school_id', selectedSchoolId)
          .gte('date_start', startOfRange)
          .lte('date_start', endOfRange),
        supabase
          .from('events')
          .select('*')
          .is('school_id', null)
          .gte('date_start', startOfRange)
          .lte('date_start', endOfRange)
      ])

      const schoolEvents = schoolEventsRes.data || []
      const globalEvents = globalEventsRes.data || []

      setEvents([...globalEvents, ...schoolEvents])
    }
    fetchEvents()
  }, [selectedSchoolId, selectedMonth])

  useEffect(() => {
    if (!canvasRef.current || !selectedSchoolId) return

    const [year, month] = selectedMonth.split('-').map(Number)
    const school = schools.find(s => s.id === selectedSchoolId)

    const config: CalendarConfig = {
      startYear: year,
      startMonth: month,
      schoolName: school?.name || '',
      events: events.filter(e => includeHoliday || categories.find(c => c.id === e.category)?.is_holiday === false),
      categories,
    }

    drawCalendar(canvasRef.current, config)
  }, [selectedSchoolId, selectedMonth, events, includeHoliday, schools, categories])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const school = schools.find(s => s.id === selectedSchoolId)
    const [y, m] = selectedMonth.split('-').map(Number)
    const nextDate = addMonths(new Date(y, m - 1, 1), 1)
    const y1 = y, m1 = String(m).padStart(2, '0')
    const y2 = nextDate.getFullYear(), m2 = String(nextDate.getMonth() + 1).padStart(2, '0')

    // ユーザー指定のファイル形式: calendar_YYYYMM-YYYYMM_学校名.png
    const fileName = `calendar_${y1}${m1}-${y2}${m2}_${school?.name || 'school'}.png`

    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      showToast('PNG画像をダウンロードしました')
    }, 'image/png')
  }

  const months = generateMonths()

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    marginBottom: '8px',
    letterSpacing: '0.05em',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #333333',
    background: '#161616',
    color: '#E6E6E6',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderLeft: '4px solid #FFFFFF', paddingLeft: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>カレンダー出力</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 320px) 1fr', gap: '32px', alignItems: 'flex-start' }}>

        {/* 左側: コントロールパネル */}
        <div style={{ background: '#222222', border: '1px solid #333333', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          <div>
            <label style={labelStyle}>対象の学校</label>
            <select
              style={selectStyle}
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#E6E6E6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
            >
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>出力対象月</label>
            <select
              style={selectStyle}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#E6E6E6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
            >
              {months.map(m => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {m.year}年 {m.month}月
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>出力オプション</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#E6E6E6', letterSpacing: '0.05em' }}>
              <input
                type="checkbox"
                checked={includeHoliday}
                onChange={(e) => setIncludeHoliday(e.target.checked)}
                style={{ accentColor: '#E6E6E6' }}
              />
              祝日を含める
            </label>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleDownload}
              style={{
                width: '100%',
                padding: '16px',
                background: '#E6E6E6',
                color: '#161616',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.1em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <DownloadSimple weight="bold" size={16} /> PNG画像を出力する
            </button>
          </div>

        </div>

        {/* 右側: プレビュー */}
        <div style={{ background: '#222222', border: '1px solid #333333', padding: '32px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#888888' }}>
            <ImageSquare weight="duotone" size={20} />
            <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em' }}>プレビュー表示（A4・縦）</h2>
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#161616',
            border: '1px solid #333333',
            overflow: 'auto',
            padding: '24px'
          }}>
            {/* プレビュー自体は白ベースを維持 */}
            <div style={{ boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
              <canvas
                ref={canvasRef}
                width={2480}
                height={3508}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  background: '#fff'
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CalendarOutput