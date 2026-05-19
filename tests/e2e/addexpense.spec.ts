import { test, expect } from '@playwright/test'
import { createTestRoom, deleteTestRoom } from './helpers'

test.describe('지출 추가 바텀시트 — TC-060~073', () => {
  let roomId = ''

  test.beforeEach(async ({ page }) => {
    roomId = await createTestRoom({ name: '지출추가테스트', members: ['A', 'B', 'C'] })
    await page.addInitScript((id) => {
      localStorage.setItem('triply_rooms', JSON.stringify([id]))
    }, roomId)
    await page.goto(`/room/${roomId}`)
    await expect(page.getByText('지출추가테스트')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '지출 추가' }).click()
    // 바텀시트 열릴 때까지 대기
    await expect(page.getByText('지출 추가')).toBeVisible({ timeout: 3000 })
  })

  test.afterEach(async () => {
    await deleteTestRoom(roomId)
  })

  /* TC-060: 바텀시트 열기 */
  test('TC-060: FAB 클릭 후 바텀시트 표시', async ({ page }) => {
    await expect(page.getByPlaceholder(/저녁 식사|렌터카/)).toBeVisible()
  })

  /* TC-061: 오버레이 클릭 → 닫힘 */
  test('TC-061: 오버레이 배경 클릭 → 바텀시트 닫힘', async ({ page }) => {
    // overlay의 onClick(onClose)을 직접 dispatchEvent로 트리거
    await page.locator('[class*="overlay"]').first().dispatchEvent('click')
    await expect(page.getByPlaceholder(/저녁 식사|렌터카/)).not.toBeVisible({ timeout: 3000 })
  })

  /* TC-062: X 버튼 클릭 → 닫힘 */
  test('TC-062: X 버튼 클릭 → 바텀시트 닫힘', async ({ page }) => {
    await page.getByRole('button', { name: '닫기' }).click()
    await expect(page.getByPlaceholder(/저녁 식사|렌터카/)).not.toBeVisible()
  })

  /* TC-063: 금액 입력 */
  test('TC-063: 금액 입력 → 금액 표시', async ({ page }) => {
    await page.locator('[class*="amountBlock"]').click()
    await page.keyboard.type('123')
    await expect(page.locator('[class*="amountDisplay"]')).toContainText('123')
  })

  /* TC-064: 백스페이스 */
  test('TC-064: 백스페이스 → 마지막 자리 삭제', async ({ page }) => {
    await page.locator('[class*="amountBlock"]').click()
    await page.keyboard.type('56')
    await page.keyboard.press('Backspace')
    await expect(page.locator('[class*="amountDisplay"]')).toContainText('5')
  })

  /* TC-066: 카테고리 선택 */
  test('TC-066: 카테고리 "교통" 선택 → 활성화', async ({ page }) => {
    // button[class*="chip"] 로 div.chips와 구분 (chips 컨테이너는 div이므로 button 한정)
    const transportBtn = page.locator('[class*="fieldSection"] button[class*="chip"]').filter({ hasText: '교통' })
    await transportBtn.click()
    await expect(transportBtn).toHaveClass(/active/)
  })

  /* TC-067: 결제자 선택 */
  test('TC-067: 결제자 B 선택 → 단일 선택', async ({ page }) => {
    // payerBtn 클래스를 가진 버튼 중 'B' 텍스트 포함
    const payerBBtn = page.locator('[class*="payerBtn"]').filter({ hasText: 'B' })
    await payerBBtn.click()
    await expect(payerBBtn).toHaveClass(/active/)
  })

  /* TC-069: 전체 해제 버튼 */
  test('TC-069: 전체 해제 버튼 → 모든 인원 해제', async ({ page }) => {
    // 기본값: 전체 선택 → "전체 해제" 버튼 표시
    await expect(page.getByRole('button', { name: '전체 해제' })).toBeVisible()
    await page.getByRole('button', { name: '전체 해제' }).click()
    await expect(page.getByRole('button', { name: '전체 선택' })).toBeVisible()
  })

  /* TC-070: 전체 선택 버튼 */
  test('TC-070: 전체 선택 버튼 → 모든 인원 선택', async ({ page }) => {
    await page.getByRole('button', { name: '전체 해제' }).click()
    await page.getByRole('button', { name: '전체 선택' }).click()
    await expect(page.getByRole('button', { name: '전체 해제' })).toBeVisible()
  })

  /* TC-073: 기본값 확인 */
  test('TC-073: 기본값 — 카테고리:식사, 전체 선택 상태', async ({ page }) => {
    // 카테고리 기본: 식사
    await expect(page.getByRole('button', { name: '식사' }).first()).toHaveClass(/active/)
    // 전체 해제 버튼 보임 = 전체 선택 상태
    await expect(page.getByRole('button', { name: '전체 해제' })).toBeVisible()
  })

  /* TC-161: 금액 0일 때 추가 버튼 비활성화 */
  test('TC-161: 금액 0 → 추가하기 버튼 비활성화', async ({ page }) => {
    await expect(page.getByRole('button', { name: /지출 입력/ })).toBeDisabled()
  })

  /* TC-162: 항목명 없을 때 비활성화 */
  test('TC-162: 항목명 없고 금액만 있을 때 → 비활성화', async ({ page }) => {
    await page.locator('[class*="amountBlock"]').click()
    await page.keyboard.type('5')
    await expect(page.getByRole('button', { name: /지출 입력/ })).toBeDisabled()
  })

  /* TC-163: 참여 인원 0명 → 비활성화 */
  test('TC-163: 참여 인원 0명 → 추가 버튼 비활성화', async ({ page }) => {
    await page.locator('[class*="amountBlock"]').click()
    await page.keyboard.type('5')
    await page.getByPlaceholder(/저녁 식사|렌터카/).fill('테스트')
    await page.getByRole('button', { name: '전체 해제' }).click()
    await expect(page.locator('[class*="submitBtn"]')).toBeDisabled()
  })

  /* TC-171: 버튼 텍스트 상태 */
  test('TC-171: 금액+항목명 입력 시 버튼 활성화', async ({ page }) => {
    // 초기: "지출 입력" (disabled)
    await expect(page.locator('[class*="submitBtn"]')).toContainText('지출 입력')
    await expect(page.locator('[class*="submitBtn"]')).toBeDisabled()

    await page.locator('[class*="amountBlock"]').click()
    await page.keyboard.type('5000')
    await page.getByPlaceholder(/저녁 식사|렌터카/).fill('점심')
    // 금액+항목명 있으면 버튼 활성화
    await expect(page.locator('[class*="submitBtn"]')).not.toBeDisabled()
    await expect(page.locator('[class*="submitBtn"]')).toContainText('지출 입력')
  })

  /* TC-172: 바텀시트 내부 클릭 → 닫히지 않음 */
  test('TC-172: 바텀시트 내부 클릭 → 닫히지 않음', async ({ page }) => {
    const sheet = page.locator('[class*="sheet"]').first()
    await sheet.click({ position: { x: 100, y: 100 } })
    await expect(page.getByPlaceholder(/저녁 식사|렌터카/)).toBeVisible()
  })

  /* TC-072: 지출 추가 제출 → Firebase 저장 후 바텀시트 닫힘 */
  test('TC-072: 지출 추가 제출 → 성공 후 목록 업데이트', async ({ page }) => {
    await page.locator('[class*="amountBlock"]').click()
    await page.keyboard.type('5000')
    await page.getByPlaceholder(/저녁 식사|렌터카/).fill('저녁 식사')

    const submitBtn = page.locator('[class*="submitBtn"]')
    await expect(submitBtn).not.toBeDisabled()
    await submitBtn.click()

    // 바텀시트 닫힘
    await expect(page.getByPlaceholder(/저녁 식사|렌터카/)).not.toBeVisible({ timeout: 5000 })
    // 지출 목록에 추가됨
    await expect(page.getByText('저녁 식사')).toBeVisible()
  })
})
