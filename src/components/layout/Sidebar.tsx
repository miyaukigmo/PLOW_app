import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SquaresFour, Buildings, CalendarBlank, Package, CaretLeft, CaretRight, Flag, Palette } from '@phosphor-icons/react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const Sidebar: React.FC = () => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const navItems: NavItem[] = [
    { path: '/', label: 'ダッシュボード', icon: <SquaresFour weight="duotone" size={20} /> },
    { path: '/schools', label: '学校管理', icon: <Buildings weight="duotone" size={20} /> },
    { path: '/global-events', label: '共通イベント', icon: <Flag weight="duotone" size={20} /> },
    { path: '/calendar', label: 'カレンダー出力', icon: <CalendarBlank weight="duotone" size={20} /> },
    { path: '/lots', label: '配布ロット', icon: <Package weight="duotone" size={20} /> },
    { path: '/category-settings', label: 'カテゴリ設定', icon: <Palette weight="duotone" size={20} /> },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '220px',
        minHeight: '100vh',
        background: '#161616',  // Base color
        borderRight: '1px solid #333333',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* ロゴ */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          borderBottom: '1px solid #333333',
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          background: '#E6E6E6',
          flexShrink: 0,
        }} />
        {!collapsed && (
          <div style={{ marginLeft: '12px', color: '#E6E6E6', fontWeight: 700, fontSize: '15px', letterSpacing: '0.08em' }}>
            PLOW Dashboard
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <nav style={{ flex: 1, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '40px',
                padding: collapsed ? '0' : '0 24px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? '#161616' : '#888888',
                background: active ? '#FFFFFF' : 'transparent',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: collapsed ? '0' : '12px',
                color: active ? '#161616' : '#888888'
              }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* 折りたたみボタン */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid #333333',
          color: '#888888',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#E6E6E6'
          e.currentTarget.style.background = '#222222'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#888888'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {collapsed ? <CaretRight weight="bold" /> : <CaretLeft weight="bold" />}
      </button>
    </aside>
  )
}

export default Sidebar
