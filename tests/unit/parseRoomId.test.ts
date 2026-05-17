import { describe, it, expect } from 'vitest'
import { parseRoomId } from '../../src/utils/parseRoomId'

describe('parseRoomId', () => {
  describe('전체 URL 입력', () => {
    it('표준 URL에서 roomId 추출', () => {
      expect(parseRoomId('https://triply.vercel.app/room/abc123')).toBe('abc123')
    })

    it('하이픈·언더스코어 포함 roomId 추출', () => {
      expect(parseRoomId('https://triply.vercel.app/room/room-id_01')).toBe('room-id_01')
    })

    it('localhost URL에서도 추출', () => {
      expect(parseRoomId('http://localhost:5173/room/xyz789')).toBe('xyz789')
    })

    it('/room/ 경로가 없는 URL은 null 반환', () => {
      expect(parseRoomId('https://triply.vercel.app/invalid/abc123')).toBeNull()
    })
  })

  describe('roomId 직접 입력', () => {
    it('영문 소문자만 있는 roomId', () => {
      expect(parseRoomId('abc123')).toBe('abc123')
    })

    it('영문 대소문자·숫자·하이픈·언더스코어 혼합', () => {
      expect(parseRoomId('Room_ID-01')).toBe('Room_ID-01')
    })

    it('앞뒤 공백 있어도 trim 후 처리', () => {
      expect(parseRoomId('  abc123  ')).toBe('abc123')
    })
  })

  describe('빈 값 / 유효하지 않은 값 → null 반환', () => {
    it('빈 문자열 → null', () => {
      expect(parseRoomId('')).toBeNull()
    })

    it('공백만 있는 문자열 → null', () => {
      expect(parseRoomId('   ')).toBeNull()
    })

    it('한국어 포함 → null', () => {
      expect(parseRoomId('방아이디123')).toBeNull()
    })

    it('특수문자 포함 → null', () => {
      expect(parseRoomId('abc!@#')).toBeNull()
    })

    it('슬래시 포함된 비URL 입력 → null', () => {
      expect(parseRoomId('abc/def')).toBeNull()
    })
  })
})
