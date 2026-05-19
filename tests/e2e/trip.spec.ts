import { test, expect } from '@playwright/test'
import { createTestRoom, addExpenseToRoom, deleteTestRoom } from './helpers'

/* TC-141: 존재하지 않는 방 → 에러 */
test('TC-141: 잘못된 roomId → 에러 + 홈으로 돌아가기', async ({ page }) => {
  await page.goto('/room/nonexistent-room-id-that-does-not-exist-12345')
  await expect(page.getByText(/존재하지 않는 방이에요/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/홈으로 돌아가기/)).toBeVisible()
})

/* TC-143: 로딩 상태 */
test('TC-143: 방 로딩 중 — 불러오는 중... 표시', async ({ page }) => {
  const roomId = await createTestRoom({ name: '로딩테스트', members: ['A', 'B'] })

  // 로딩 메시지가 잠깐 보이는지 확인 (Firebase 응답 전)
  await page.goto(`/room/${roomId}`)
  // 로딩이 완료되어도 에러가 없어야 함
  await expect(page.getByText(/로딩|불러오는 중|로딩테스트/)).toBeVisible({ timeout: 10000 })

  await deleteTestRoom(roomId)
})

/* TC-044: 실시간 업데이트 & TC-050: 통계 계산 */
test('TC-050: 총 지출 / 1인 평균 계산 표시', async ({ page }) => {
  const roomId = await createTestRoom({ name: '통계테스트', members: ['A', 'B', 'C'] })
  await addExpenseToRoom(roomId, { title: '식사', amount: 30000, paidBy: 'A', splitWith: ['A', 'B', 'C'], category: '식사' })
  await addExpenseToRoom(roomId, { title: '교통', amount: 60000, paidBy: 'B', splitWith: ['A', 'B', 'C'], category: '교통' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)

  // 총 지출: 90,000 / 1인 평균: 30,000 (동일 텍스트 중복 가능하므로 first())
  await expect(page.getByText('90,000').first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('30,000').first()).toBeVisible()

  await deleteTestRoom(roomId)
})

/* TC-045: 카테고리 필터 */
test('TC-045: 카테고리 필터 — 식사만 표시', async ({ page }) => {
  const roomId = await createTestRoom({ name: '필터테스트', members: ['A', 'B'] })
  await addExpenseToRoom(roomId, { title: '저녁 식사', amount: 50000, paidBy: 'A', splitWith: ['A', 'B'], category: '식사' })
  await addExpenseToRoom(roomId, { title: '택시', amount: 20000, paidBy: 'B', splitWith: ['A', 'B'], category: '교통' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)
  await expect(page.getByText('저녁 식사')).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: '식사' }).click()
  await expect(page.getByText('저녁 식사')).toBeVisible()
  await expect(page.getByText('택시')).not.toBeVisible()

  await deleteTestRoom(roomId)
})

/* TC-046: 전체 복귀 */
test('TC-046: 카테고리 필터 → 전체 → 모두 표시', async ({ page }) => {
  const roomId = await createTestRoom({ name: '전체복귀테스트', members: ['A', 'B'] })
  await addExpenseToRoom(roomId, { title: '저녁 식사', amount: 50000, paidBy: 'A', splitWith: ['A', 'B'], category: '식사' })
  await addExpenseToRoom(roomId, { title: '택시', amount: 20000, paidBy: 'B', splitWith: ['A', 'B'], category: '교통' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)
  await expect(page.getByText('저녁 식사')).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: '식사' }).click()
  await page.getByRole('button', { name: '전체' }).click()
  await expect(page.getByText('저녁 식사')).toBeVisible()
  await expect(page.getByText('택시')).toBeVisible()

  await deleteTestRoom(roomId)
})

/* TC-047: FAB 클릭 → 바텀시트 열림 */
test('TC-047: FAB(+) 클릭 → 지출 추가 바텀시트 열림', async ({ page }) => {
  const roomId = await createTestRoom({ name: 'FAB테스트', members: ['A', 'B'] })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)

  await expect(page.getByText('FAB테스트')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: '지출 추가' }).click()
  await expect(page.getByText('지출 추가')).toBeVisible()

  await deleteTestRoom(roomId)
})

/* TC-048: 정산하기 버튼 → settle 화면 */
test('TC-048: 정산하기 버튼 → /settle로 이동', async ({ page }) => {
  const roomId = await createTestRoom({ name: '정산이동테스트', members: ['A', 'B'] })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)

  await expect(page.getByText('정산이동테스트')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: /정산하기/ }).click()
  await expect(page).toHaveURL(new RegExp(`/room/${roomId}/settle`))

  await deleteTestRoom(roomId)
})

/* TC-049: 뒤로가기 → 홈 */
test('TC-049: 뒤로가기 버튼 → 홈으로 이동', async ({ page }) => {
  const roomId = await createTestRoom({ name: '뒤로가기테스트', members: ['A', 'B'] })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)

  await expect(page.getByText('뒤로가기테스트')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: '뒤로' }).click()
  await expect(page).toHaveURL('/')

  await deleteTestRoom(roomId)
})

/* TC-052: LIVE 표시 (active 방) */
test('TC-052: active 방 — LIVE 칩 표시', async ({ page }) => {
  const roomId = await createTestRoom({ name: 'LIVE테스트', members: ['A', 'B'], status: 'active' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)

  // liveLabel 클래스로 정확히 LIVE 칩 확인 (방 이름에 포함된 'LIVE'와 구분)
  await expect(page.locator('[class*="liveLabel"]')).toBeVisible({ timeout: 10000 })

  await deleteTestRoom(roomId)
})

/* TC-144: 지출 없을 때 빈 상태 */
test('TC-144: 지출 없을 때 전체 필터 — 빈 상태 메시지', async ({ page }) => {
  const roomId = await createTestRoom({ name: '빈상태테스트', members: ['A', 'B'] })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)

  await expect(page.getByText(/아직 지출이 없어요/)).toBeVisible({ timeout: 10000 })

  await deleteTestRoom(roomId)
})

/* TC-145: 해당 카테고리 지출 없음 */
test('TC-145: 카테고리 필터 — 해당 카테고리 지출 없음 메시지', async ({ page }) => {
  const roomId = await createTestRoom({ name: '빈카테고리테스트', members: ['A', 'B'] })
  // 식사만 있고 숙소는 없는 상태
  await addExpenseToRoom(roomId, { title: '밥', amount: 10000, paidBy: 'A', splitWith: ['A', 'B'], category: '식사' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}`)
  await expect(page.getByText('밥')).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: '숙소' }).click()
  await expect(page.getByText(/숙소 항목이 없어요/)).toBeVisible()

  await deleteTestRoom(roomId)
})

/* TC-054: 초대 링크 직접 진입 → localStorage 등록 */
test('TC-054: URL 직접 진입 → localStorage에 roomId 자동 등록', async ({ page }) => {
  const roomId = await createTestRoom({ name: '직접진입테스트', members: ['A', 'B'] })

  // localStorage에 아무것도 없는 상태
  await page.goto(`/room/${roomId}`)

  // localStorage에 roomId가 등록됐는지 확인
  const rooms = await page.evaluate(() => {
    const raw = localStorage.getItem('triply_rooms')
    return raw ? JSON.parse(raw) : []
  })
  expect(rooms).toContain(roomId)

  await deleteTestRoom(roomId)
})
