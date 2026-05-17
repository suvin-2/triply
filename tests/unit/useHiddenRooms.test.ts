import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHiddenRooms } from '../../src/hooks/useHiddenRooms'

const STORAGE_KEY = 'triply_hidden_rooms'

describe('useHiddenRooms', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('초기 상태: hiddenRoomIds 빈 배열', () => {
    const { result } = renderHook(() => useHiddenRooms())
    expect(result.current.hiddenRoomIds).toEqual([])
  })

  it('localStorage에 기존 숨김 목록이 있으면 초기 로드', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['room-1', 'room-2']))
    const { result } = renderHook(() => useHiddenRooms())
    expect(result.current.hiddenRoomIds).toEqual(['room-1', 'room-2'])
  })

  it('hideRoom: 방 ID를 숨김 목록에 추가', () => {
    const { result } = renderHook(() => useHiddenRooms())
    act(() => { result.current.hideRoom('room-abc') })
    expect(result.current.hiddenRoomIds).toContain('room-abc')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toContain('room-abc')
  })

  it('hideRoom: 중복 추가 무시', () => {
    const { result } = renderHook(() => useHiddenRooms())
    act(() => { result.current.hideRoom('room-abc') })
    act(() => { result.current.hideRoom('room-abc') })
    expect(result.current.hiddenRoomIds.filter((id) => id === 'room-abc')).toHaveLength(1)
  })

  it('restoreRoom: 방 ID를 숨김 목록에서 제거', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['room-1', 'room-2']))
    const { result } = renderHook(() => useHiddenRooms())
    act(() => { result.current.restoreRoom('room-1') })
    expect(result.current.hiddenRoomIds).not.toContain('room-1')
    expect(result.current.hiddenRoomIds).toContain('room-2')
  })

  it('removeFromHidden: restoreRoom과 동일하게 제거', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['room-x']))
    const { result } = renderHook(() => useHiddenRooms())
    act(() => { result.current.removeFromHidden('room-x') })
    expect(result.current.hiddenRoomIds).not.toContain('room-x')
  })

  it('isHidden: 숨긴 방이면 true 반환', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['room-hidden']))
    const { result } = renderHook(() => useHiddenRooms())
    expect(result.current.isHidden('room-hidden')).toBe(true)
  })

  it('isHidden: 숨기지 않은 방이면 false 반환', () => {
    const { result } = renderHook(() => useHiddenRooms())
    expect(result.current.isHidden('room-visible')).toBe(false)
  })

  it('localStorage 데이터 손상 시 빈 배열로 초기화', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json{{{')
    const { result } = renderHook(() => useHiddenRooms())
    expect(result.current.hiddenRoomIds).toEqual([])
  })
})
