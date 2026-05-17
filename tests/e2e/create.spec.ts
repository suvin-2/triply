import { test, expect } from '@playwright/test'

test.describe('방 개설 화면 — TC-020~031', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create')
  })

  /* TC-020: 뒤로가기 → 홈 */
  test('TC-020: 뒤로가기 버튼 → 홈으로 이동', async ({ page }) => {
    await page.getByRole('button', { name: /뒤로/ }).click()
    await expect(page).toHaveURL('/')
  })

  /* TC-021: 인원 추가 (엔터) */
  test('TC-021: 이름 입력 후 Enter → 칩 추가', async ({ page }) => {
    await page.getByPlaceholder('이름 입력 후 엔터').fill('수빈')
    await page.getByPlaceholder('이름 입력 후 엔터').press('Enter')
    await expect(page.getByText('수빈')).toBeVisible()
    // 입력란 초기화 확인
    await expect(page.getByPlaceholder('이름 입력 후 엔터')).toHaveValue('')
  })

  /* TC-022: 인원 추가 (버튼) */
  test('TC-022: 이름 입력 후 + 추가 버튼 → 칩 추가', async ({ page }) => {
    await page.getByPlaceholder('이름 입력 후 엔터').fill('지민')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await expect(page.getByText('지민')).toBeVisible()
    await expect(page.getByPlaceholder('이름 입력 후 엔터')).toHaveValue('')
  })

  /* TC-023: 인원 삭제 */
  test('TC-023: 멤버 칩 × 버튼 → 삭제', async ({ page }) => {
    await page.getByPlaceholder('이름 입력 후 엔터').fill('태형')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByRole('button', { name: '태형 삭제' }).click()
    await expect(page.getByText('태형')).not.toBeVisible()
  })

  /* TC-121: 여행 이름 없이 → 버튼 비활성화 */
  test('TC-121: 여행 이름 없으면 버튼 비활성화', async ({ page }) => {
    // 인원 2명 추가
    await page.getByPlaceholder('이름 입력 후 엔터').fill('A')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('B')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await expect(page.getByRole('button', { name: /방 만들고 링크 공유/ })).toBeDisabled()
  })

  /* TC-122: 인원 1명 → 버튼 비활성화 */
  test('TC-122: 인원 1명이면 버튼 비활성화', async ({ page }) => {
    await page.getByPlaceholder('제주 3박 4일').fill('테스트 여행')
    await page.getByPlaceholder('이름 입력 후 엔터').fill('A')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await expect(page.getByRole('button', { name: /방 만들고 링크 공유/ })).toBeDisabled()
  })

  /* TC-123: 인원 0명 → 버튼 비활성화 */
  test('TC-123: 인원 없으면 버튼 비활성화', async ({ page }) => {
    await page.getByPlaceholder('제주 3박 4일').fill('테스트 여행')
    await expect(page.getByRole('button', { name: /방 만들고 링크 공유/ })).toBeDisabled()
  })

  /* TC-124: 종료일이 시작일보다 이른 경우 */
  test('TC-124: 종료일 < 시작일 → 날짜 에러 + 버튼 비활성화', async ({ page }) => {
    await page.getByPlaceholder('제주 3박 4일').fill('날짜 테스트')
    await page.getByPlaceholder('이름 입력 후 엔터').fill('A')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('B')
    await page.getByRole('button', { name: '+ 추가' }).click()

    // 날짜 입력 (시작일: 2025-05-10, 종료일: 2025-05-08)
    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.nth(0).fill('2025-05-10')
    await dateInputs.nth(1).fill('2025-05-08')

    await expect(page.getByText(/종료일이 시작일보다 이를 수 없어요/)).toBeVisible()
    await expect(page.getByRole('button', { name: /방 만들고 링크 공유/ })).toBeDisabled()
  })

  /* TC-125: 중복 이름 추가 안됨 */
  test('TC-125: 중복 이름 추가 시도 → 무시', async ({ page }) => {
    await page.getByPlaceholder('이름 입력 후 엔터').fill('중복테스트')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('중복테스트')
    await page.getByRole('button', { name: '+ 추가' }).click()
    // span[class*="chip"]으로 × 버튼(_chipRemove_도 chip 포함)과 구분
    const chipSpans = page.locator('[class*="memberChips"] span[class*="chip"]')
    await expect(chipSpans).toHaveCount(1)
  })

  /* TC-127: 공백만 있는 이름 추가 안됨 */
  test('TC-127: 공백만 있는 이름 → 추가 안됨', async ({ page }) => {
    await page.getByPlaceholder('이름 입력 후 엔터').fill('   ')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await expect(page.locator('span.chip, [class*="chip"]').first()).not.toBeVisible()
  })
})

test.describe('방 개설 화면 — Firebase 연동 (TC-024~031)', () => {
  /* TC-024: 방 만들기 성공 → 오버레이 표시 */
  test('TC-024: 방 만들기 성공 시 오버레이 표시', async ({ page }) => {
    await page.goto('/create')

    await page.getByPlaceholder('제주 3박 4일').fill('E2E 테스트 방')
    await page.getByPlaceholder('이름 입력 후 엔터').fill('수빈')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('지민')
    await page.getByRole('button', { name: '+ 추가' }).click()

    await page.getByRole('button', { name: /방 만들고 링크 공유/ }).click()

    // 오버레이 표시 대기 (Firebase 저장 시간 포함)
    await expect(page.getByText('방이 만들어졌어요!')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/아래 링크를 친구들에게/)).toBeVisible()
  })

  /* TC-027: 링크 복사 버튼 */
  test('TC-027: 복사 버튼 클릭 → "복사됨" 표시', async ({ page }) => {
    await page.goto('/create')
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByPlaceholder('제주 3박 4일').fill('복사 테스트')
    await page.getByPlaceholder('이름 입력 후 엔터').fill('A')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('B')
    await page.getByRole('button', { name: '+ 추가' }).click()

    await page.getByRole('button', { name: /방 만들고 링크 공유/ }).click()
    await expect(page.getByText('방이 만들어졌어요!')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: '복사' }).click()
    await expect(page.getByText('복사됨')).toBeVisible()
  })

  /* TC-028: 여행 시작하기 버튼 → /room/{id} 이동 */
  test('TC-028: 여행 시작하기 → 방으로 이동', async ({ page }) => {
    await page.goto('/create')

    await page.getByPlaceholder('제주 3박 4일').fill('시작 테스트')
    await page.getByPlaceholder('이름 입력 후 엔터').fill('A')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('B')
    await page.getByRole('button', { name: '+ 추가' }).click()

    await page.getByRole('button', { name: /방 만들고 링크 공유/ }).click()
    await expect(page.getByText('방이 만들어졌어요!')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /여행 시작하기/ }).click()
    await expect(page).toHaveURL(/\/room\//)
  })

  /* TC-131: 복사됨 상태 2초 후 복원 */
  test('TC-131: 복사 후 2초 뒤 "복사됨" → "복사"로 복원', async ({ page }) => {
    await page.goto('/create')
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByPlaceholder('제주 3박 4일').fill('복원 테스트')
    await page.getByPlaceholder('이름 입력 후 엔터').fill('A')
    await page.getByRole('button', { name: '+ 추가' }).click()
    await page.getByPlaceholder('이름 입력 후 엔터').fill('B')
    await page.getByRole('button', { name: '+ 추가' }).click()

    await page.getByRole('button', { name: /방 만들고 링크 공유/ }).click()
    await expect(page.getByText('방이 만들어졌어요!')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: '복사' }).click()
    await expect(page.getByText('복사됨')).toBeVisible()
    // 2초 후 복원 확인
    await expect(page.getByText('복사')).toBeVisible({ timeout: 3000 })
  })
})
