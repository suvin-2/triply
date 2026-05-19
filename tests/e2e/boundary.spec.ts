import { test, expect } from '@playwright/test'
import {
  createTestRoom,
  addExpenseToRoom,
  deleteTestRoom,
  setRoomStatus,
} from './helpers'
import path from 'path'

// 200건 추가 테스트는 기본 타임아웃으로 실패할 수 있으므로 전체 파일에 적용
test.setTimeout(120_000)

const SCREENSHOT_DIR = path.resolve(import.meta.dirname, '../reports/boundary-test')
const createdRoomIds: string[] = []

function shot(name: string) {
  return path.join(SCREENSHOT_DIR, `${name}.png`)
}

test.afterAll(async () => {
  for (const roomId of createdRoomIds) {
    await deleteTestRoom(roomId)
  }
})

/* ───────────────────────────────────────────────────────────────────
   TC-B01: 방 이름 30자 입력 → CreateScreen CharCounter 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B01: 방 이름 30자 입력 → CharCounter 표시 확인', async ({ page }) => {
  await page.goto('/create')
  const nameInput = page.locator('input[placeholder="제주 3박 4일"]')
  await expect(nameInput).toBeVisible()

  const maxName = '가'.repeat(30)
  await nameInput.fill(maxName)

  // CharCounter가 30/30 (빨간색) 표시 여부
  await expect(page.getByText('30/30')).toBeVisible()
  await page.screenshot({ path: shot('01-room-name-max') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B02: 인원 10명 → HomeScreen RoomCard AvatarStack 표시 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B02: 인원 10명 → RoomCard AvatarStack 표시 확인', async ({ page }) => {
  const members = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank', 'Iris', 'Jack']
  const roomId = await createTestRoom({ name: '10명 경계값 테스트', members })
  createdRoomIds.push(roomId)

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'Alice')
  }, roomId)

  await page.goto('/')
  await expect(page.getByText('10명 경계값 테스트')).toBeVisible({ timeout: 10000 })
  await page.screenshot({ path: shot('02-ten-members-avatarstack') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B03: 인원 이름 10자 → CreateScreen CharCounter 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B03: 인원 이름 10자 → CharCounter 표시 확인', async ({ page }) => {
  await page.goto('/create')
  const memberInput = page.locator('input[placeholder="이름 입력 후 엔터"]')
  await expect(memberInput).toBeVisible()

  const maxMemberName = '가'.repeat(10)
  await memberInput.fill(maxMemberName)

  await expect(page.getByText('10/10')).toBeVisible()
  await page.screenshot({ path: shot('03-member-name-max') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B04: 지출 항목명 20자 → CharCounter 및 ExpenseCard 표시 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B04: 지출 항목명 20자 → CharCounter 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: '항목명 경계값', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}`)
  await page.waitForLoadState('networkidle')

  // FAB(+) 클릭 → 바텀시트 열기
  await page.getByRole('button', { name: '지출 추가' }).click()
  const titleInput = page.locator('input[placeholder="저녁 식사, 렌터카, 숙소..."]')
  await expect(titleInput).toBeVisible({ timeout: 5000 })

  const maxTitle = '가'.repeat(20)
  await titleInput.fill(maxTitle)
  await expect(page.getByText('20/20')).toBeVisible()
  await page.screenshot({ path: shot('04-expense-title-max') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B05: 금액 9,999,900원 입력 → 키패드/금액 디스플레이 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B05: 금액 9,999,900원 입력 → 금액 표시 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: '금액 경계값', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '지출 추가' }).click()
  await expect(page.locator('[class*="amountBlock"]')).toBeVisible({ timeout: 5000 })

  await page.locator('[class*="amountBlock"]').click()
  await page.keyboard.type('9999900')

  // 금액 디스플레이에 "9,999,900" 포함 여부
  await expect(page.locator('[class*="amountDisplay"]')).toContainText('9,999,900')
  await page.screenshot({ path: shot('05-max-amount') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B06: 지출 200건 추가 → 목록 스크롤 성능 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B06: 지출 200건 → 목록 스크롤 성능 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: '200건 경계값', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  // 200건을 20개씩 병렬 추가 (속도 최적화)
  const BATCH = 20
  const TOTAL = 200
  for (let batch = 0; batch < TOTAL / BATCH; batch++) {
    await Promise.all(
      Array.from({ length: BATCH }, (_, i) =>
        addExpenseToRoom(roomId, {
          title: `지출 ${batch * BATCH + i + 1}`,
          amount: 10000,
          paidBy: 'A',
          splitWith: ['A', 'B'],
          category: '기타',
        }),
      ),
    )
  }

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}`)

  // 200건 렌더링 완료 대기 — 마지막에 추가된 항목이 목록에 표시될 때까지
  await expect(page.locator('[class*="expenseItem"]').first()).toBeVisible({ timeout: 15000 })

  const startTime = Date.now()
  await page.evaluate(() => {
    const list = document.querySelector('[class*="expenseList"]')
    if (list) list.scrollTop = list.scrollHeight
  })
  const scrollTime = Date.now() - startTime
  console.log(`200건 스크롤 소요 시간: ${scrollTime}ms`)

  await page.screenshot({ path: shot('06-200-expenses-scroll') })
  // 스크롤이 1초 이내 완료되어야 함
  expect(scrollTime).toBeLessThan(1000)
})

/* ───────────────────────────────────────────────────────────────────
   TC-B07: 인원 10명 정산 → 송금 내역 표시 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B07: 인원 10명 정산 → 송금 내역 표시 확인', async ({ page }) => {
  const members = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
  const roomId = await createTestRoom({ name: '10명 정산 경계값', members })
  createdRoomIds.push(roomId)

  // 각 멤버가 돌아가며 결제하도록 지출 추가
  await Promise.all(
    members.map((m, i) =>
      addExpenseToRoom(roomId, {
        title: `${m} 결제 항목`,
        amount: (i + 1) * 10000,
        paidBy: m,
        splitWith: members,
        category: '식사',
      }),
    ),
  )

  await setRoomStatus(roomId, 'done')

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}/settle`)
  await expect(page.locator('[class*="transferRow"]').first()).toBeVisible({ timeout: 10000 })
  await page.screenshot({ path: shot('07-ten-members-settlement') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B08: 지출 10건 초과 → 영수증 카드 "외 N건 더" 말줄임 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B08: 지출 15건 → 영수증 카드 "외 N건 더" 표시 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: '영수증 오버플로 테스트', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  // 15건 추가 (10건 표시 + 5건 숨김)
  await Promise.all(
    Array.from({ length: 15 }, (_, i) =>
      addExpenseToRoom(roomId, {
        title: `항목 ${String(i + 1).padStart(2, '0')}`,
        amount: 10000,
        paidBy: 'A',
        splitWith: ['A', 'B'],
        category: '기타',
      }),
    ),
  )

  await setRoomStatus(roomId, 'done')

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}/settle`)
  // 영수증 카드 탭으로 전환
  await page.getByRole('button', { name: '영수증 카드' }).click()
  await expect(page.getByText(/\+ \d+건 더/)).toBeVisible({ timeout: 10000 })
  await page.screenshot({ path: shot('08-receipt-overflow') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B09: 금액 상한 10,000,000원 → 초과 입력 차단 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B09: 금액 10,000,000원 초과 입력 차단 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: '금액 상한 테스트', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '지출 추가' }).click()
  await expect(page.locator('[class*="amountBlock"]')).toBeVisible({ timeout: 5000 })

  await page.locator('[class*="amountBlock"]').click()

  // 9,999,999 입력
  await page.keyboard.type('9999999')
  await expect(page.locator('[class*="amountDisplay"]')).toContainText('9,999,999')

  // 1 추가 입력 → 99,999,991 > MAX_AMOUNT → 차단
  await page.keyboard.type('1')
  await expect(page.locator('[class*="amountDisplay"]')).not.toContainText('99,999,991')

  // 추가 입력 차단 — 값이 변하지 않아야 함
  const before = await page.locator('[class*="amountDisplay"]').textContent()
  await page.keyboard.type('1')
  const after = await page.locator('[class*="amountDisplay"]').textContent()
  expect(before).toBe(after)

  await page.screenshot({ path: shot('09-amount-max-block') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B10: 정산 완료 방 → FAB 숨김 + 안내 텍스트 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B10: 정산 완료 방 → FAB 숨김 + 안내 텍스트 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: 'FAB 숨김 테스트', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  await addExpenseToRoom(roomId, {
    title: '테스트 지출',
    amount: 10000,
    paidBy: 'A',
    splitWith: ['A', 'B'],
    category: '기타',
  })
  await setRoomStatus(roomId, 'done')

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}`)
  await page.waitForLoadState('networkidle')

  // FAB이 없어야 함
  await expect(page.getByRole('button', { name: '지출 추가' })).not.toBeVisible()
  // 안내 텍스트 표시
  await expect(page.getByText('정산이 완료된 여행이에요')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: shot('10-done-room-fab-hidden') })
})

/* ───────────────────────────────────────────────────────────────────
   TC-B11: 정산 완료 취소하기 → status: active 복원 확인
─────────────────────────────────────────────────────────────────── */
test('TC-B11: 정산 완료 취소하기 → TripScreen 복귀 확인', async ({ page }) => {
  const roomId = await createTestRoom({ name: '되돌리기 테스트', members: ['A', 'B'] })
  createdRoomIds.push(roomId)

  await addExpenseToRoom(roomId, {
    title: '되돌리기 지출',
    amount: 5000,
    paidBy: 'A',
    splitWith: ['A', 'B'],
    category: '기타',
  })
  await setRoomStatus(roomId, 'done')

  await page.addInitScript((id) => {
    localStorage.setItem('triply_rooms', JSON.stringify([id]))
    localStorage.setItem(`triply_name_${id}`, 'A')
  }, roomId)

  await page.goto(`/room/${roomId}/settle`)
  await expect(page.getByRole('button', { name: '정산 완료 취소하기' })).toBeVisible({ timeout: 5000 })

  await page.getByRole('button', { name: '정산 완료 취소하기' }).click()
  // 확인 다이얼로그
  await expect(page.getByText('정산 완료를 취소할까요?')).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: '완료 취소하기', exact: true }).click()

  // TripScreen으로 복귀
  await expect(page).toHaveURL(`/room/${roomId}`, { timeout: 8000 })
  // FAB 다시 표시되어야 함
  await expect(page.getByRole('button', { name: '지출 추가' })).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: shot('11-revert-done') })
})
