import { describe, it, expect } from 'vitest'
import { parseRoomId } from '../../src/utils/parseRoomId'

describe('parseRoomId — 8자리 초대 코드 검증', () => {
  describe('유효한 코드', () => {
    it('유효한 8자리 코드 → 대문자 그대로 반환', () => {
      expect(parseRoomId('ABCD2345')).toBe('ABCD2345')
    })

    it('소문자 입력 → 대문자로 변환하여 반환', () => {
      expect(parseRoomId('abcd2345')).toBe('ABCD2345')
    })

    it('대소문자 혼합 입력 → 대문자로 변환', () => {
      expect(parseRoomId('AbCd2345')).toBe('ABCD2345')
    })

    it('앞뒤 공백 있어도 trim 후 처리', () => {
      expect(parseRoomId('  ABCD2345  ')).toBe('ABCD2345')
    })

    it('허용 문자 전체 범위 포함 코드', () => {
      expect(parseRoomId('ZYXW9876')).toBe('ZYXW9876')
    })
  })

  describe('금지 문자 포함 → null 반환', () => {
    it('I 포함 → null', () => {
      expect(parseRoomId('ABCDI234')).toBeNull()
    })

    it('O 포함 → null', () => {
      expect(parseRoomId('ABCDO234')).toBeNull()
    })

    it('0 포함 → null', () => {
      expect(parseRoomId('ABCD0234')).toBeNull()
    })

    it('1 포함 → null', () => {
      expect(parseRoomId('ABCD1234')).toBeNull()
    })
  })

  describe('길이 불일치 → null 반환', () => {
    it('7자리 → null', () => {
      expect(parseRoomId('ABCD234')).toBeNull()
    })

    it('9자리 → null', () => {
      expect(parseRoomId('ABCD23456')).toBeNull()
    })
  })

  describe('유효하지 않은 입력 → null 반환', () => {
    it('빈 문자열 → null', () => {
      expect(parseRoomId('')).toBeNull()
    })

    it('공백만 있는 문자열 → null', () => {
      expect(parseRoomId('   ')).toBeNull()
    })

    it('한국어 포함 → null', () => {
      expect(parseRoomId('방코드1234')).toBeNull()
    })

    it('특수문자 포함 → null', () => {
      expect(parseRoomId('ABCD!@#$')).toBeNull()
    })

    it('URL 형식 → null (더 이상 지원 안 함)', () => {
      expect(parseRoomId('https://triply.vercel.app/room/abc123')).toBeNull()
    })
  })
})
