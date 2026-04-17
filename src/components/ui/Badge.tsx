import React from 'react'
import { SCHOOL_TYPE_LABELS, type SchoolType } from '../../types'
import { useCategories } from '../../hooks/useCategories'

export const SchoolTypeBadge: React.FC<{ type: SchoolType }> = ({ type }) => {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      border: '1px solid #333333',
      color: '#E6E6E6',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      background: 'transparent',
    }}>
      {SCHOOL_TYPE_LABELS[type]}
    </span>
  )
}

export const CategoryBadge: React.FC<{ category: string; unconfirmed?: boolean }> = ({ category, unconfirmed }) => {
  const { categories } = useCategories()
  
  // カテゴリマスタから色と名前を取得。なければフォールバック
  const def = categories.find(c => c.id === category) || {
    name: category,
    color: '#888888'
  }

  const baseColor = unconfirmed ? '#888888' : def.color

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: `1px solid ${baseColor}`,
      color: baseColor,
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      background: 'transparent',
    }}>
      {unconfirmed && '※'}
      {def.name}
    </span>
  )
}
