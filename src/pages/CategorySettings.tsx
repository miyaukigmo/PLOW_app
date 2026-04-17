import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { EventCategory } from '../types'
import { useToast } from '../components/ui/Toast'
import { Plus, Palette, FloppyDisk, Trash } from '@phosphor-icons/react'

const CategorySettings: React.FC = () => {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      showToast('カテゴリの取得に失敗しました', 'error')
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleUpdate = (index: number, field: keyof EventCategory, value: any) => {
    const newCats = [...categories]
    newCats[index] = { ...newCats[index], [field]: value }
    setCategories(newCats)
  }

  const handleAdd = () => {
    const newId = `cat_${Date.now()}`
    setCategories([
      ...categories,
      {
        id: newId,
        name: '新規カテゴリ',
        color: '#FFFFFF',
        is_holiday: false,
        sort_order: categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1
      }
    ])
  }

  const handleDelete = (index: number) => {
    const target = categories[index]
    if (['test', 'event', 'holiday', 'plow_event'].includes(target.id)) {
      if (!window.confirm('これはシステムの基本カテゴリです。削除すると過去のデータの色が失われる可能性があります。本当に削除しますか？')) return
    }
    const newCats = categories.filter((_, i) => i !== index)
    setCategories(newCats)
  }

  const handleSaveAll = async () => {
    if (categories.some(c => !c.name.trim() || !c.color)) {
      showToast('カテゴリ名とカラー項目は必須です', 'error')
      return
    }

    setLoading(true)
    
    // 現在のDBの全データを置き換えるシンプルなアプローチ (UPSERT)
    // 削除されたものは消すため、一旦全部消して入れ直すか、UPSERT後に存在しないものを消す
    // 実装が楽な「IDで upsert して、今回のリストに含まれないIDを delete」する方法を取る
    
    const { error: upsertError } = await supabase.from('event_categories').upsert(
      categories.map((c, i) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        is_holiday: c.is_holiday,
        sort_order: i + 1, // 現在の配列の順番で sort_order を振り直す
        updated_at: new Date().toISOString()
      }))
    )

    if (upsertError) {
      showToast('保存に失敗しました', 'error')
      setLoading(false)
      return
    }

    // 削除されたものを処理
    const activeIds = categories.map(c => c.id)
    if (activeIds.length > 0) {
      const { data: existing } = await supabase.from('event_categories').select('id')
      if (existing) {
        const toDelete = existing.filter(e => !activeIds.includes(e.id)).map(e => e.id)
        if (toDelete.length > 0) {
          await supabase.from('event_categories').delete().in('id', toDelete)
        }
      }
    }

    showToast('カテゴリ設定を保存しました')
    await fetchCategories()
  }

  const thStyle: React.CSSProperties = {
    padding: '16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    borderBottom: '1px solid #333333',
    background: '#1a1a1a',
    letterSpacing: '0.05em',
  }

  const tdStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #2a2a2a',
    verticalAlign: 'middle'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #333333',
    background: '#161616',
    color: '#E6E6E6',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', borderLeft: '4px solid #3b82f6', paddingLeft: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#E6E6E6', letterSpacing: '0.05em' }}>イベントカテゴリ設定</h1>
          <p style={{ margin: '4px 0 0', color: '#888888', fontSize: '13px', letterSpacing: '0.05em' }}>
            カレンダーや一覧に表示されるイベントの種別名と色を管理します。
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: loading ? 'transparent' : '#3b82f6',
            color: loading ? '#3b82f6' : '#161616',
            border: '1px solid #3b82f6',
            fontSize: '12px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.05em',
          }}
        >
          <FloppyDisk weight="bold" size={16} /> {loading ? '保存中...' : '変更を保存'}
        </button>
      </div>

      <div style={{ background: '#222222', border: '1px solid #333333', padding: '1px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>カテゴリ名</th>
              <th style={thStyle}>カラー</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>休日扱い<br/><span style={{ fontSize: '10px' }}>(カレンダーで数字を赤くする)</span></th>
              <th style={{ ...thStyle, width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat.id}>
                <td style={tdStyle}>
                  <input
                    style={inputStyle}
                    value={cat.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    placeholder="カテゴリ名"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
                  />
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      style={{ ...inputStyle, width: '100px' }}
                      value={cat.color.toUpperCase()}
                      onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                      placeholder="#FFFFFF"
                      maxLength={7}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#333333')}
                    />
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={cat.is_holiday}
                    onChange={(e) => handleUpdate(index, 'is_holiday', e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                  />
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                  >
                    <Trash weight="bold" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <button
            onClick={handleAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'transparent',
              color: '#E6E6E6',
              border: '1px solid #333333',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#888888'; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333333'; e.currentTarget.style.color = '#E6E6E6' }}
          >
            <Plus weight="bold" /> カテゴリを追加する
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategorySettings
