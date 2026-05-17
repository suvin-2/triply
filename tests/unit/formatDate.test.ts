import { describe, it, expect } from 'vitest'
import { formatDateLabel, toFirebaseDate } from '../../src/utils/formatDate'

describe('formatDateLabel', () => {
  describe('당일치기 (startDate === endDate)', () => {
    it('같은 날짜면 하나만 표시', () => {
      expect(formatDateLabel('5.10', '5.10')).toBe('5.10')
    })

    it('endDate가 빈 문자열이면 startDate만 표시', () => {
      expect(formatDateLabel('5.10', '')).toBe('5.10')
    })
  })

  describe('기간 여행', () => {
    it('시작일·종료일 em dash로 연결', () => {
      expect(formatDateLabel('5.10', '5.13')).toBe('5.10 — 5.13')
    })

    it('월이 달라도 올바르게 표시', () => {
      expect(formatDateLabel('12.29', '1.2')).toBe('12.29 — 1.2')
    })
  })
})

describe('toFirebaseDate', () => {
  it('YYYY-MM-DD를 M.D 형식으로 변환', () => {
    expect(toFirebaseDate('2025-05-10')).toBe('5.10')
  })

  it('앞자리 0 제거', () => {
    expect(toFirebaseDate('2025-01-07')).toBe('1.7')
  })

  it('빈 문자열 입력 → 빈 문자열 반환', () => {
    expect(toFirebaseDate('')).toBe('')
  })

  it('12월 31일 변환', () => {
    expect(toFirebaseDate('2025-12-31')).toBe('12.31')
  })
})
