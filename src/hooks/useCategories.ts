import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { EventCategory } from '../types'

const defaultCategories: EventCategory[] = [
  { id: 'test', name: 'テスト', color: '#ef4444', is_holiday: false, sort_order: 1 },
  { id: 'event', name: '行事', color: '#3b82f6', is_holiday: false, sort_order: 2 },
  { id: 'holiday', name: '休日', color: '#ef4444', is_holiday: true, sort_order: 3 },
  { id: 'plow_event', name: 'PLOW支給', color: '#10b981', is_holiday: false, sort_order: 4 },
  { id: 'test_prep', name: 'テスト対策', color: '#FF8C00', is_holiday: false, sort_order: 5 },
]

export const useCategories = () => {
  const [categories, setCategories] = useState<EventCategory[]>(defaultCategories)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('event_categories')
        .select('*')
        .order('sort_order', { ascending: true })
      
      if (data && data.length > 0) {
        setCategories(data)
      }
      setLoading(false)
    }

    fetchCategories()
  }, [])

  return { categories, loading }
}
