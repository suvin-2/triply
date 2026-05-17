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
    // statusActive 클래스를 가진 뱃지 확인 (방 이름과의 strict mode 충돌 방지)
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
    // statusDone 클래스를 가진 뱃지 확인
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
    // 멤버 수(3)가 표시되는지 확인
    await expect(page.getByText('3')).toBeVisible()
    await deleteTestRoom(roomId)
  })
})

test.describe('홈 화면 — 링크 입력 (TC-101~108)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /* TC-101: 빈 링크 입력 → 에러 */
  test('TC-101: 빈 값 이동 시 에러 메시지', async ({ page }) => {
    await page.getByRole('button', { name: /링크로 입장/ }).click()
    await expect(page.getByText(/올바른 링크 또는 방 코드를 입력해주세요/)).toBeVisible()
  })

  /* TC-102: 공백만 있는 링크 */
  test('TC-102: 공백만 입력 시 에러 메시지', async ({ page }) => {
    await page.getByPlaceholder('초대 링크 붙여넣기').fill('   ')
    await page.getByRole('button', { name: /링크로 입장/ }).click()
    await expect(page.getByText(/올바른 링크 또는 방 코드를 입력해주세요/)).toBeVisible()
  })

  /* TC-103: 잘못된 형식 링크 */
  test('TC-103: 특수문자 포함 링크 → 에러 메시지', async ({ page }) => {
    await page.getByPlaceholder('초대 링크 붙여넣기').fill('hello world!')
    await page.getByRole('button', { name: /링크로 입장/ }).click()
    await expect(page.getByText(/올바른 링크 또는 방 코드를 입력해주세요/)).toBeVisible()
  })

  /* TC-104: 에러 후 재입력 시 에러 메시지 사라짐 */
  test('TC-104: 에러 표시 중 입력 변경 시 에러 사라짐', async ({ page }) => {
    const input = page.getByPlaceholder('초대 링크 붙여넣기')
    await page.getByRole('button', { name: /링크로 입장/ }).click()
    await expect(page.getByText(/올바른 링크 또는 방 코드를 입력해주세요/)).toBeVisible()
    await input.type('a')
    await expect(page.getByText(/올바른 링크 또는 방 코드를 입력해주세요/)).not.toBeVisible()
  })

  /* TC-005: 유효한 링크 → 방 이동 */
  test('TC-005: 유효한 초대 링크 입력 후 이동', async ({ page }) => {
    const roomId = await createTestRoom({ name: '링크입장테스트', members: ['A', 'B'] })
    await page.getByPlaceholder('초대 링크 붙여넣기').fill(`http://localhost:5173/room/${roomId}`)
    await page.getByRole('button', { name: /링크로 입장/ }).click()
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`))
    await deleteTestRoom(roomId)
  })

  /* TC-006: Enter 키로 이동 */
  test('TC-006: 유효한 링크 입력 후 Enter 이동', async ({ page }) => {
    const roomId = await createTestRoom({ name: 'Enter이동테스트', members: ['A', 'B'] })
    await page.getByPlaceholder('초대 링크 붙여넣기').fill(`http://localhost:5173/room/${roomId}`)
    await page.getByPlaceholder('초대 링크 붙여넣기').press('Enter')
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`))
    await deleteTestRoom(roomId)
  })

  /* TC-007: roomId 직접 입력 */
  test('TC-007: roomId 직접 입력 후 이동', async ({ page }) => {
    const roomId = await createTestRoom({ name: 'roomId직접입력', members: ['A', 'B'] })
    await page.getByPlaceholder('초대 링크 붙여넣기').fill(roomId)
    await page.getByRole('button', { name: /링크로 입장/ }).click()
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`))
    await deleteTestRoom(roomId)
  })

  /* TC-108: 입력값 없을 때 버튼 스타일 */
  test('TC-108: 입력값 없을 때 링크 버튼 스타일 분기', async ({ page }) => {
    const btn = page.getByRole('button', { name: /링크로 입장/ })
    // 입력값 없음 → noInput 클래스
    await expect(btn).toHaveClass(/noInput/)
    await page.getByPlaceholder('초대 링크 붙여넣기').fill('abc')
    // 입력값 있음 → hasInput 클래스
    await expect(btn).toHaveClass(/hasInput/)
  })
})

/* TC-209: 존재하지 않는 경로 → 홈 리다이렉트 */
test('TC-209: 알 수 없는 경로 → 홈으로 리다이렉트', async ({ page }) => {
  await page.goto('/nonexistent/path')
  await expect(page).toHaveURL('/')
})
