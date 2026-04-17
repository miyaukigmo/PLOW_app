import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { School, Lot } from '../types'
import { differenceInDays, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Buildings, Package, Warning, CalendarBlank, CaretRight } from '@phosphor-icons/react'

const Dashboard: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: schoolData }, { data: lotData }] = await Promise.all([
        supabase.from('schools').select('*').order('updated_at', { ascending: true }),
        supabase.from('lots').select('*').order('distributed_date', { ascending: false }).limit(5),
      ])
      if (schoolData) setSchools(schoolData)
      if (lotData) setLots(lotData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const staleSchools = schools.filter((s) => {
    const days = differenceInDays(new Date(), new Date(s.updated_at))
    return days >= 30
  })

  // ストイックなカードスタイル
  const cardStyle: React.CSSProperties = {
    background: '#222222',
    border: '1px solid #333333',
    overflow: 'hidden',
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <CalendarBlank weight="duotone" size={32} />
        <span style={{ fontSize: '13px', letterSpacing: '0.1em' }}>読み込み中...</span>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1000px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '40px', borderLeft: '4px solid #00E5FF', paddingLeft: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>
          ダッシュボード
        </h1>
        <p style={{ margin: '4px 0 0', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
          {format(new Date(), 'yyyy.MM.dd', { locale: ja })} // 本日の状況
        </p>
      </div>

      {/* 統計カード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: '登録学校数', value: schools.length, icon: <Buildings weight="duotone" size={28} />, color: '#E6E6E6' },
          { label: '要更新の学校', value: staleSchools.length, icon: <Warning weight="duotone" size={28} />, color: staleSchools.length > 0 ? '#EF4444' : '#E6E6E6' },
          { label: '配布ロット総数', value: lots.length, icon: <Package weight="duotone" size={28} />, color: '#E6E6E6' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888888', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '12px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 300, color: stat.color, fontFamily: 'sans-serif' }}>
                  {stat.value}
                </div>
              </div>
              <span style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 更新リマインダー */}
        <div style={cardStyle}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#1a1a1a'
          }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#E6E6E6', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
              <Warning weight="bold" size={16} color="#00E5FF" />
              更新リマインダー
            </h2>
            <Link to="/schools" style={{ fontSize: '11px', color: '#888888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.05em' }}>
              すべて見る <CaretRight weight="bold" />
            </Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {staleSchools.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
                全校のデータが最新です。
              </div>
            ) : (
              staleSchools.map((s) => {
                const days = differenceInDays(new Date(), new Date(s.updated_at))
                return (
                  <Link
                    key={s.id}
                    to={`/schools/${s.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      textDecoration: 'none',
                      borderBottom: '1px solid #333333',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#E6E6E6' }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px', letterSpacing: '0.05em' }}>
                        最終更新：{format(new Date(s.updated_at), 'yyyy.MM.dd')}
                      </div>
                    </div>
                    <span style={{
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      {days}日経過
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* 直近ロット */}
        <div style={cardStyle}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#1a1a1a'
          }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#E6E6E6', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
              <Package weight="bold" size={16} color="#00E5FF" />
              直近の配布ロット
            </h2>
            <Link to="/lots" style={{ fontSize: '11px', color: '#888888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.05em' }}>
              すべて見る <CaretRight weight="bold" />
            </Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {lots.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
                配布ロットがありません。
              </div>
            ) : (
              lots.map((lot) => {
                const rate = lot.answer_box_count != null
                  ? Math.round((lot.answer_box_count / lot.distributed_count) * 100)
                  : null
                return (
                  <Link
                    key={lot.id}
                    to={`/lots/${lot.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      textDecoration: 'none',
                      borderBottom: '1px solid #333333',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#E6E6E6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {lot.lot_code}
                        {lot.batch_code && <span style={{ color: '#888888', fontSize: '11px', letterSpacing: '0.05em' }}>{lot.batch_code}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888888', marginTop: '4px', letterSpacing: '0.05em' }}>
                        {format(new Date(lot.distributed_date), 'MM.dd')} // {lot.location} // {lot.distributed_count}部
                      </div>
                    </div>
                    {rate != null && (
                      <span style={{
                        color: rate >= 5 ? '#10B981' : '#888888',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        border: `1px solid ${rate >= 5 ? '#10B981' : '#333333'}`
                      }}>
                        回収率 {rate}%
                      </span>
                    )}
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
