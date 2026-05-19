import { test, expect } from '@playwright/test'
import { createTestRoom, deleteTestRoom } from './helpers'

test.describe('홈 화면 — TC-001~012', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /* TC-001: 빈 방 목록 + 메시지 */
  test('TC-001: 빈 상태 메시지 표시', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('triply_rooms'))
    await page.reload()
    await expect(page.getByText(/아직 여행이 없어요/)).toBeVisible()
  })

  /* TC-004: 새 여행 만들기 → /create */
  test('TC-004: 새 여행 만들기 버튼 → /create 이동', async ({ page }) => {
    await page.getByRole('button', { name: /새 여행 만들기/ }).click()
    await expect(page).toHaveURL(/\/create/)
  })

  /* TC-008: 진행중 여행 카운트 표시 */
  test('TC-008: 진행 중인 여행 카운트', async ({ page }) => {
    const roomId = await createTestRoom({ name: '진행중방', members: ['A', 'B'] })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.reload()
    await expect(page.getByText(/진행 중인 여행/)).toBeVisible()
    await deleteTestRoom(roomId)
  })

  /* TC-003: 방 카드 클릭 → /room/{id} */
  test('TC-003: 방 카드 클릭 시 해당 방으로 이동', async ({ page }) => {
    const roomId = await createTestRoom({ name: '카드클릭테스트', members: ['A', 'B'] })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.reload()
    await page.getByText('카드클릭테스트').click()
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`))
    await deleteTestRoom(roomId)
  })

  /* TC-009: active 방 진행중 뱃지 */
  test('TC-009: active 방 — 진행중 뱃지 표시', async ({ page }) => {
    const roomId = await createTestRoom({ name: '진행중방', members: ['A', 'B'], status: 'active' })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.reload()
    await expect(page.locator('[class*="statusActive"]')).toBeVisible({ timeout: 10000 })
    await deleteTestRoom(roomId)
  })

  /* TC-010: done 방 정산완료 뱃지 */
  test('TC-010: done 방 — 정산완료 뱃지 표시', async ({ page }) => {
    const roomId = await createTestRoom({ name: '완료방', members: ['A', 'B'], status: 'done' })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.reload()
    await expect(page.locator('[class*="statusDone"]')).toBeVisible({ timeout: 10000 })
    await deleteTestRoom(roomId)
  })

  /* TC-011: 멤버 수 표시 */
  test('TC-011: 방 카드 멤버 수 표시', async ({ page }) => {
    const roomId = await createTestRoom({ name: '멤버수테스트', members: ['A', 'B', 'C'] })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.reload()
    await expect(page.getByText('3')).toBeVisible()
    await deleteTestRoom(roomId)
  })
})

test.describe('홈 화면 — 초대 코드 입력 (TC-101~108)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /* TC-101: 빈 코드 입력 → 에러 */
  test('TC-101: 빈 값 이동 시 에러 메시지', async ({ page }) => {
    await page.getByRole('button', { name: /코드로 입장/ }).click()
    await expect(page.getByText(/올바른 초대 코드를 입력해주세요/)).toBeVisible()
  })

  /* TC-102: 공백만 있는 코드 */
  test('TC-102: 공백만 입력 시 에러 메시지', async ({ page }) => {
    await page.getByPlaceholder('초대 코드 8자리 입력').fill('   ')
    await page.getByRole('button', { name: /코드로 입장/ }).click()
    await expect(page.getByText(/올바른 초대 코드를 입력해주세요/)).toBeVisible()
  })

  /* TC-103: 잘못된 형식 코드 */
  test('TC-103: 특수문자 포함 입력 → 에러 메시지', async ({ page }) => {
    await page.getByPlaceholder('초대 코드 8자리 입력').fill('hello world!')
    await page.getByRole('button', { name: /코드로 입장/ }).click()
    await expect(page.getByText(/올바른 초대 코드를 입력해주세요/)).toBeVisible()
  })

  /* TC-104: 에러 후 재입력 시 에러 메시지 사라짐 */
  test('TC-104: 에러 표시 중 입력 변경 시 에러 사라짐', async ({ page }) => {
    const input = page.getByPlaceholder('초대 코드 8자리 입력')
    await page.getByRole('button', { name: /코드로 입장/ }).click()
    await expect(page.getByText(/올바른 초대 코드를 입력해주세요/)).toBeVisible()
    await input.type('A')
    await expect(page.getByText(/올바른 초대 코드를 입력해주세요/)).not.toBeVisible()
  })

  /* TC-005: 유효한 초대 코드 입력 후 이동 */
  test('TC-005: 유효한 초대 코드 입력 후 이동', async ({ page }) => {
    const inviteCode = 'ABCD2345'
    const roomId = await createTestRoom({ name: '코드입장테스트', members: ['A', 'B'], inviteCode })
    await page.getByPlaceholder('초대 코드 8자리 입력').fill(inviteCode)
    await page.getByRole('button', { name: /코드로 입장/ }).click()
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`), { timeout: 15000 })
    await deleteTestRoom(roomId)
  })

  /* TC-006: Enter 키로 이동 */
  test('TC-006: 유효한 초대 코드 입력 후 Enter 이동', async ({ page }) => {
    const inviteCode = 'BCDE3456'
    const roomId = await createTestRoom({ name: 'Enter이동테스트', members: ['A', 'B'], inviteCode })
    await page.getByPlaceholder('초대 코드 8자리 입력').fill(inviteCode)
    await page.getByPlaceholder('초대 코드 8자리 입력').press('Enter')
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`), { timeout: 15000 })
    await deleteTestRoom(roomId)
  })

  /* TC-007: 소문자 코드 입력 → 대문자 변환 후 이동 */
  test('TC-007: 소문자 초대 코드 입력 후 이동 (대문자 변환 검증)', async ({ page }) => {
    const inviteCode = 'CDEF4567'
    const roomId = await createTestRoom({ name: '소문자입력테스트', members: ['A', 'B'], inviteCode })
    await page.getByPlaceholder('초대 코드 8자리 입력').fill('cdef4567')
    await page.getByRole('button', { name: /코드로 입장/ }).click()
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`), { timeout: 15000 })
    await deleteTestRoom(roomId)
  })

  /* TC-108: 입력값 없을 때 버튼 스타일 */
  test('TC-108: 입력값 없을 때 코드 버튼 스타일 분기', async ({ page }) => {
    const btn = page.getByRole('button', { name: /코드로 입장/ })
    await expect(btn).toHaveClass(/noInput/)
    await page.getByPlaceholder('초대 코드 8자리 입력').fill('ABC')
    await expect(btn).toHaveClass(/hasInput/)
  })
})

/* TC-209: 존재하지 않는 경로 → 홈 리다이렉트 */
test('TC-209: 알 수 없는 경로 → 홈으로 리다이렉트', async ({ page }) => {
  await page.goto('/nonexistent/path')
  await expect(page).toHaveURL('/')
})
