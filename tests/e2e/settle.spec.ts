import { test, expect } from '@playwright/test'
import { createTestRoom, addExpenseToRoom, deleteTestRoom, setRoomStatus } from './helpers'

/* TC-182: 존재하지 않는 방 */
test('TC-182: 잘못된 roomId settle → 에러 + 홈으로 돌아가기', async ({ page }) => {
  await page.goto('/room/nonexistent-settle-test-12345/settle')
  await expect(page.getByText(/존재하지 않는 방이에요|방 정보를 찾을 수 없어요/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/홈으로 돌아가기/)).toBeVisible()
})

test.describe('정산 결과 화면 — TC-080~094', () => {
  let roomId = ''

  test.beforeEach(async ({ page }) => {
    roomId = await createTestRoom({ name: '정산테스트방', members: ['A', 'B', 'C'] })
    // A가 전부 냄 (B, C가 각각 A에게 송금해야 함)
    await addExpenseToRoom(roomId, {
      title: '숙소',
      amount: 90000,
      paidBy: 'A',
      splitWith: ['A', 'B', 'C'],
      category: '숙소',
    })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.goto(`/room/${roomId}/settle`)
    await expect(page.getByText('정산테스트방')).toBeVisible({ timeout: 10000 })
  })

  test.afterEach(async () => {
    await deleteTestRoom(roomId)
  })

  /* TC-080: 정산 목록 표시 */
  test('TC-080: 최소 송금 횟수 정산 목록 표시', async ({ page }) => {
    // B→A, C→A 각 30,000원 (arrow가 2개이므로 first() 사용)
    await expect(page.getByText('→').first()).toBeVisible()
    await expect(page.locator('[class*="toName"]').first()).toBeVisible()
  })

  /* TC-081: 송금 내역 탭 기본 활성화 */
  test('TC-081: 송금 내역 탭이 기본 활성화', async ({ page }) => {
    await expect(page.getByRole('button', { name: '송금 내역' })).toHaveClass(/active/)
  })

  /* TC-082: 영수증 카드 탭 전환 */
  test('TC-082: 영수증 카드 탭 클릭 → 영수증 미리보기 표시', async ({ page }) => {
    await page.getByRole('button', { name: '영수증 카드' }).click()
    await expect(page.getByRole('button', { name: '영수증 카드' })).toHaveClass(/active/)
    // 이미지 저장 / 공유하기 버튼 표시
    await expect(page.getByRole('button', { name: '이미지 저장' })).toBeVisible()
    await expect(page.getByRole('button', { name: '공유하기' })).toBeVisible()
  })

  /* TC-083: 송금 내역 탭 재전환 */
  test('TC-083: 영수증 카드 탭 → 송금 내역 탭 재전환', async ({ page }) => {
    await page.getByRole('button', { name: '영수증 카드' }).click()
    await page.getByRole('button', { name: '송금 내역' }).click()
    await expect(page.getByRole('button', { name: '송금 내역' })).toHaveClass(/active/)
    await expect(page.getByText('→').first()).toBeVisible()
  })

  /* TC-089: 정산 완료 버튼 클릭 → 다이얼로그 */
  test('TC-089: 정산 완료 버튼 → 확인 다이얼로그 표시', async ({ page }) => {
    await page.getByRole('button', { name: /정산 완료로 표시하기/ }).click()
    await expect(page.getByText(/정말 정산 완료로 표시할까요/)).toBeVisible()
  })

  /* TC-090: 다이얼로그 취소 */
  test('TC-090: 다이얼로그 취소 → 닫힘', async ({ page }) => {
    await page.getByRole('button', { name: /정산 완료로 표시하기/ }).click()
    await page.getByRole('button', { name: '취소' }).click()
    await expect(page.getByText(/정말 정산 완료로 표시할까요/)).not.toBeVisible()
  })

  /* TC-091: 다이얼로그 바깥 클릭 → 닫힘 */
  test('TC-091: 다이얼로그 오버레이 클릭 → 닫힘', async ({ page }) => {
    await page.getByRole('button', { name: /정산 완료로 표시하기/ }).click()
    await expect(page.getByText(/정말 정산 완료로 표시할까요/)).toBeVisible()
    // 다이얼로그 오버레이 클릭 (다이얼로그 밖)
    await page.locator('[class*="dialogOverlay"]').click({ position: { x: 10, y: 10 } })
    await expect(page.getByText(/정말 정산 완료로 표시할까요/)).not.toBeVisible()
  })

  /* TC-092: 정산 완료 확인 → Firebase status:done → 홈 이동 */
  test('TC-092: 완료로 표시 → Firebase 업데이트 후 홈 이동', async ({ page }) => {
    await page.getByRole('button', { name: /정산 완료로 표시하기/ }).click()
    // exact: true로 "정산 완료로 표시하기"와 구분
    await page.locator('[class*="dialogConfirm"]').click()
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  /* TC-093: 뒤로가기 → /room/{id} */
  test('TC-093: 뒤로가기 → 지출 목록으로 이동', async ({ page }) => {
    await page.getByRole('button', { name: '뒤로' }).click()
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}$`))
  })

  /* TC-084: 토스 딥링크 버튼 */
  test('TC-084: 토스 버튼 클릭 → supertoss:// 스킴 호출 시도', async ({ page }) => {
    // 딥링크는 브라우저에서 URL 이동을 시도함 (에러 없이 동작해야 함)
    const [_, tossBtn] = await Promise.all([
      page.waitForEvent('load', { timeout: 2000 }).catch(() => null),
      page.getByRole('button', { name: '토스' }).first(),
    ])
    await expect(tossBtn).toBeVisible()
    // 버튼 클릭은 에러 없이 동작
    await tossBtn.click()
  })
})

/* TC-094: 정산 불필요한 경우 */
test('TC-094: 균등 분담 → 정산 불필요 메시지', async ({ page }) => {
  const roomId = await createTestRoom({ name: '균등정산테스트', members: ['A', 'B'] })
  // 각자 자기 몫만 낸 경우
  await addExpenseToRoom(roomId, { title: 'A몫', amount: 10000, paidBy: 'A', splitWith: ['A'], category: '기타' })
  await addExpenseToRoom(roomId, { title: 'B몫', amount: 10000, paidBy: 'B', splitWith: ['B'], category: '기타' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}/settle`)

  await expect(page.getByText(/정산이 필요 없어요/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/모두 균등하게 나눠냈어요/)).toBeVisible()

  await deleteTestRoom(roomId)
})

/* TC-181: 이미 정산완료된 방 */
test('TC-181: done 방 — 완료 버튼 비활성화', async ({ page }) => {
  const roomId = await createTestRoom({ name: '완료방테스트', members: ['A', 'B'], status: 'done' })

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
  }, roomId)
  await page.goto(`/room/${roomId}/settle`)

  await expect(page.getByText(/이미 정산 완료된 여행이에요/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /이미 정산 완료된 여행이에요/ })).toBeDisabled()

  await deleteTestRoom(roomId)
})
