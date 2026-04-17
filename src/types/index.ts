// ============================================================
// 型定義ファイル
// ============================================================

export type SchoolType = 'elementary' | 'junior_high' | 'high_school'

export interface EventCategory {
  id: string
  name: string
  color: string
  is_holiday: boolean
  sort_order: number
}

export interface School {
  id: string
  name: string
  type: SchoolType
  memo: string | null
  updated_at: string
  created_at: string
}

export interface SchoolEvent {
  id: string
  school_id: string | null
  name: string
  category: string
  date_start: string
  date_end: string | null
  is_confirmed: boolean
  memo: string | null
  parent_event_id: string | null
  created_at: string
  updated_at: string
}

export interface Lot {
  id: string
  lot_code: string
  batch_code: string | null
  distributed_date: string
  location: string
  distributed_count: number
  memo: string | null
  answer_box_count: number | null
  line_register_count: number | null
  visit_count: number | null
  visit_memo: string | null
  created_at: string
  updated_at: string
}

// ラベル変換ユーティリティ
export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  elementary: '小学校',
  junior_high: '中学校',
  high_school: '高校',
}
