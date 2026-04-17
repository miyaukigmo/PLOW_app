import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, addMonths } from 'date-fns'
import type { SchoolEvent, EventCategory } from '../../types'

export interface CalendarConfig {
  startYear: number
  startMonth: number // 1-indexed (1-12)
  schoolName: string
  events: SchoolEvent[]
  categories: EventCategory[]
  visibleCategories?: Set<string>
}

// ==========================================
// 定数定義 (A4縦 300dpi相当)
// ==========================================
const WIDTH = 2480
const HEIGHT = 3508

const MARGIN_X = 96
const GAP_HEADER = 300
const GAP_FOOTER = 350
const GAP_BETWEEN_MONTHS = 64

// 修正①: TOTAL_DRAW_HEIGHT から GAP_BETWEEN_MONTHS を除外し、
//         MONTH_BLOCK_HEIGHT を Math.floor で整数化
const TOTAL_DRAW_HEIGHT = HEIGHT - GAP_HEADER - GAP_FOOTER // 3008
const MONTH_BLOCK_HEIGHT = Math.floor((TOTAL_DRAW_HEIGHT - GAP_BETWEEN_MONTHS) / 2) // 1472

const H_MONTH_HEADER = 160
const H_SEP = 1
const H_WEEKDAY_LABEL = 80
const H_GRID_AREA = MONTH_BLOCK_HEIGHT - H_MONTH_HEADER - H_SEP - H_WEEKDAY_LABEL // 1231

const CONTENT_WIDTH = WIDTH - (MARGIN_X * 2)

const COLORS = {
  text: '#1a1a1a',
  sunday: '#c0392b',
  saturday: '#2980b9',
  otherMonth: '#cccccc',
  grid: '#d0d0d0',
  accent: '#1a1a1a',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * 1ヶ月分のカレンダーを描画する内部関数
 */
const drawMonthBlock = (
  ctx: CanvasRenderingContext2D,
  config: CalendarConfig,
  year: number,
  month: number,
  yOffset: number
) => {
  const targetDate = new Date(year, month - 1)
  const monthNameEN = format(targetDate, 'MMMM')

  // --- 1. 月名ヘッダー (H: 160px) ---
  const headerBaselineY = yOffset + 110

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLORS.text
  ctx.font = '200 120px "Noto Sans JP"'
  ctx.fillText(`${month}`, MARGIN_X, headerBaselineY)
  const monthNumWidth = ctx.measureText(`${month}`).width

  ctx.font = '200 56px "Noto Sans JP"'
  ctx.fillText('月', MARGIN_X + monthNumWidth + 8, headerBaselineY)
  const monthTextWidth = ctx.measureText('月').width

  ctx.font = '300 32px "Noto Sans JP"'
  ctx.fillText(` / ${monthNameEN} ${year}`, MARGIN_X + monthNumWidth + 8 + monthTextWidth + 20, headerBaselineY - 8)

  ctx.textAlign = 'right'
  ctx.font = '300 28px "Noto Sans JP"'
  ctx.fillText(config.schoolName, WIDTH - MARGIN_X, headerBaselineY - 12)

  // 区切り線 (1px)
  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = COLORS.accent
  ctx.moveTo(MARGIN_X, yOffset + H_MONTH_HEADER)
  ctx.lineTo(WIDTH - MARGIN_X, yOffset + H_MONTH_HEADER)
  ctx.stroke()

  // --- 2. 曜日ラベル行 (H: 80px) ---
  const weekdayRowTop = yOffset + H_MONTH_HEADER + H_SEP
  const weekdayCenterY = weekdayRowTop + H_WEEKDAY_LABEL / 2 + 10
  const colWidth = CONTENT_WIDTH / 7

  ctx.textAlign = 'center'
  ctx.font = '300 26px "Noto Sans JP"'

  WEEKDAYS.forEach((wd, i) => {
    let wdColor = COLORS.text
    if (i === 0) wdColor = COLORS.sunday
    if (i === 6) wdColor = COLORS.saturday
    ctx.fillStyle = wdColor
    ctx.fillText(wd, MARGIN_X + i * colWidth + colWidth / 2, weekdayCenterY)
  })

  // --- 3. 日付グリッド ---
  const gridTop = weekdayRowTop + H_WEEKDAY_LABEL

  const firstDay = startOfMonth(targetDate)
  const lastDay = endOfMonth(targetDate)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - getDay(firstDay))
  const endDate = new Date(lastDay)
  if (getDay(lastDay) !== 6) {
    endDate.setDate(endDate.getDate() + (6 - getDay(lastDay)))
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const rowCount = Math.ceil(days.length / 7)

  // 修正②: rowHeight を Math.floor で整数化（浮動小数点誤差防止）
  const rowHeight = Math.floor(H_GRID_AREA / rowCount)

  // 3-a. セル内容（日付・イベント）の描画
  days.forEach((day, i) => {
    const col = i % 7
    const row = Math.floor(i / 7)
    const x = MARGIN_X + col * colWidth
    const y = gridTop + row * rowHeight

    // イベント抽出
    const dayEvents = config.events.filter(ev => {
      if (config.visibleCategories && !config.visibleCategories.has(ev.category)) return false
      const evStart = new Date(ev.date_start)
      const evEnd = ev.date_end ? new Date(ev.date_end) : evStart
      return day >= new Date(evStart.setHours(0, 0, 0, 0)) && day <= new Date(evEnd.setHours(23, 59, 59, 999))
    })

    const sortedEvents = dayEvents.sort((a, b) => {
      if (a.school_id === null && b.school_id !== null) return -1
      if (a.school_id !== null && b.school_id === null) return 1
      return new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    })

    const isHoliday = sortedEvents.some(ev => {
      const cat = config.categories.find(c => c.id === ev.category)
      return cat?.is_holiday
    })

    let dayColor = COLORS.text
    let dayWeight = '300'
    if (!isSameMonth(day, targetDate)) {
      dayColor = COLORS.otherMonth
      dayWeight = '200'
    } else if (col === 0 || isHoliday) {
      dayColor = COLORS.sunday
    } else if (col === 6) {
      dayColor = COLORS.saturday
    }

    // 日付
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.font = `${dayWeight} 64px "Noto Sans JP"`
    ctx.fillStyle = dayColor
    ctx.fillText(format(day, 'd'), x + 16, y + 16)

    // イベント
    let eventY = y + 96
    const maxEvents = 3
    const eventsToDraw = sortedEvents.slice(0, maxEvents)
    // セル下端（少し余裕を持たせる）
    const cellBottom = y + rowHeight - 8

    eventsToDraw.forEach((ev) => {
      // 修正③: セル下端をはみ出す場合は描画しない
      if (eventY + 38 > cellBottom) return

      const cat = config.categories.find(c => c.id === ev.category)
      let chipColor = cat?.color || '#888888'
      if (!ev.is_confirmed) chipColor = '#aaaaaa'

      ctx.fillStyle = chipColor
      ctx.fillRect(x + 16, eventY + 2, 4, 30)

      ctx.fillStyle = COLORS.text
      ctx.font = '400 20px "Noto Sans JP"'
      let label = (ev.is_confirmed ? '' : '※') + ev.name
      if (label.length > 15) label = label.substring(0, 14) + '...'
      ctx.fillText(label, x + 30, eventY + 6)

      eventY += 38
    })

    if (sortedEvents.length > maxEvents) {
      if (eventY + 24 <= cellBottom) {
        ctx.fillStyle = COLORS.otherMonth
        ctx.font = '400 18px "Noto Sans JP"'
        ctx.fillText(`他+${sortedEvents.length - maxEvents}`, x + 30, eventY + 4)
      }
    }
  })

  // 3-b. 罫線描画（曜日行の下から始め、全行同一間隔）
  ctx.lineWidth = 1
  ctx.strokeStyle = COLORS.grid
  for (let r = 0; r <= rowCount; r++) {
    const lineY = gridTop + r * rowHeight
    ctx.beginPath()
    ctx.moveTo(MARGIN_X, lineY)
    ctx.lineTo(WIDTH - MARGIN_X, lineY)
    ctx.stroke()
  }
}

export const drawCalendar = (canvas: HTMLCanvasElement, config: CalendarConfig) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = WIDTH
  canvas.height = HEIGHT

  // 背景透過（fillRect は使わない）
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  // 1ヶ月目
  drawMonthBlock(ctx, config, config.startYear, config.startMonth, GAP_HEADER)

  // 2ヶ月目
  const nextDate = addMonths(new Date(config.startYear, config.startMonth - 1, 1), 1)
  drawMonthBlock(
    ctx,
    config,
    nextDate.getFullYear(),
    nextDate.getMonth() + 1,
    GAP_HEADER + MONTH_BLOCK_HEIGHT + GAP_BETWEEN_MONTHS
  )
}