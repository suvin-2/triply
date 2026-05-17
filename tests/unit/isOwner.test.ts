import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isOwner } from '../../src/utils/isOwner'

describe('isOwner', () => {
  const roomId = 'test-room-001'
  const token = 'uuid-token-abc'

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('localStorage 토큰과 Firebase 토큰이 일치하면 true 반환', () => {
    localStorage.setItem(`triply_owner_${roomId}`, token)
    expect(isOwner(roomId, token)).toBe(true)
  })

  it('localStorage 토큰과 Firebase 토큰이 다르면 false 반환', () => {
    localStorage.setItem(`triply_owner_${roomId}`, 'different-token')
    expect(isOwner(roomId, token)).toBe(false)
  })

  it('localStorage에 토큰이 없으면 false 반환', () => {
    expect(isOwner(roomId, token)).toBe(false)
  })

  it('ownerToken이 undefined이면 false 반환 (구버전 방)', () => {
    localStorage.setItem(`triply_owner_${roomId}`, token)
    expect(isOwner(roomId, undefined)).toBe(false)
  })

  it('ownerToken이 빈 문자열이면 false 반환', () => {
    localStorage.setItem(`triply_owner_${roomId}`, '')
    expect(isOwner(roomId, '')).toBe(false)
  })

  it('다른 방 ID의 토큰은 영향 없음', () => {
    localStorage.setItem(`triply_owner_other-room`, token)
    expect(isOwner(roomId, token)).toBe(false)
  })
})
