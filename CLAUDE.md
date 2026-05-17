# Triply — Claude Code 컨텍스트

여행 정산 앱. 회원가입 없이 링크 공유로 입장하고, 여행 중 지출을 실시간으로 입력한 뒤 최소 송금 횟수로 정산한다.

- 타겟: 한국 사용자
- 앱스토어 부제: "여행 정산" (검색 최적화)
- 회원가입 없음 — 이름 입력 → localStorage 저장

---

## 기술 스택

| 역할 | 기술 |
|---|---|
| 웹앱 | React + TypeScript + Vite |
| 스타일 | SCSS + CSS Modules |
| DB | Firebase Realtime Database |
| 공유 카드 | html2canvas + Web Share API |
| 딥링크 | 토스 / 카카오페이 URL Scheme |
| 네이티브 래퍼 | Expo + react-native-webview |
| 웹 배포 | Vercel |
| 앱 배포 | EAS Build |

---

## 화면 구성 (5본)

### 1본 — 홈 (방 목록)
- localStorage에 저장된 내 방 목록 표시
- RoomCard: 여행 이름 / 날짜 / 인원 / 상태 뱃지 (진행중 · 정산완료)
- 초대 링크 붙여넣기 입력창 → 자동 입장
- 새 여행 만들기 버튼 → 2본
- 링크로 직접 진입 시 URL의 방 ID 파싱 → 3본으로 자동 이동

### 2본 — 방 개설
- 여행 이름 TextInput
- 날짜 DateRangePicker (시작일 — 종료일)
- 인원 TagInput (이름 입력 후 엔터, 추가/삭제)
- 방 만들기 버튼 → Firebase room 생성 → 초대 링크 생성 → 링크 공유 모달 → 3본 이동

### 3본 — 지출 목록 (메인)
- TripHeader: 여행 이름 / 날짜 / 인원 / LIVE 표시
- StatRow: 총 지출 / 1인 평균 (큰 숫자, JetBrains Mono)
- CategoryChips: 전체 / 식사 / 교통 / 숙소 / 관광 / 기타
- ExpenseCard 리스트: 항목명 / 결제자 / 금액 / 참여 인원 / 1인당 금액
- Firebase Realtime DB 구독 → 실시간 업데이트
- FAB (+) → 4본 바텀시트
- 정산하기 버튼 → 5본

### 4본 — 지출 추가 (바텀시트)
- 88% 높이 바텀시트 (3본 위에 올라옴)
- 큰 숫자 디스플레이 (금액, JetBrains Mono)
- 커스텀 숫자 키패드
- 항목명 TextInput
- 카테고리 SingleSelect (식사/교통/숙소/관광/기타)
- 결제자 SingleSelect (1명만)
- 참여 인원 MultiToggle (기본값: 전체 선택)
- 1인당 금액 실시간 계산 및 표시
- 추가하기 버튼 → Firebase 저장 → 3본 복귀

### 5본 — 정산 결과
- 정산 끝났어요 타이틀
- SettleList: 최소 송금 횟수로 계산된 "A → B 13,000원"
- DeepLinkBtn: 토스 / 카카오페이 버튼 (각 송금 건별)
- 탭: 송금 내역 / 영수증 카드
- ReceiptCard: 영수증 스타일 공유 카드 (인스타 스토리용)
- 이미지 저장 버튼 (html2canvas)
- 공유하기 버튼 (Web Share API → 카톡/인스타/문자)
- 정산 완료로 표시하기 버튼 (하단, 아웃라인 스타일, 확인 다이얼로그) → Firebase status: "done" → 1본 홈 이동

---

## Firebase 데이터 구조

```
rooms/
  {roomId}/
    title: string
    startDate: string
    endDate: string
    members: string[]
    status: "active" | "done"
    createdAt: number
    expenses/
      {expenseId}/
        title: string
        category: "식사" | "교통" | "숙소" | "관광" | "기타"
        paidBy: string
        amount: number
        splitWith: string[]
        createdAt: number
```

---

## 정산 알고리즘

```typescript
// 1. 각자 실제 부담금 계산
//    참여한 지출들의 N빵 합산
// 2. 각자 실제 낸 금액 계산
//    결제자로 등록된 지출 합산
// 3. 차액 계산
//    플러스 = 더 낸 사람 (받아야 함)
//    마이너스 = 덜 낸 사람 (보내야 함)
// 4. 그리디 알고리즘으로 송금 횟수 최소화
//    가장 많이 받을 사람 ↔ 가장 많이 보낼 사람 매칭
//    차액이 0이 될 때까지 반복
```

---

## 사용자 식별

```typescript
// 로그인 없음
// 방 진입 시 이름 입력 → localStorage 저장
// key: `triply_name_{roomId}` → value: "제제"
// 같은 링크 재진입 시 localStorage에서 자동 로드
```

---

## 딥링크

```
토스: supertoss://send?amount={금액}&bank={은행}&accountNo={계좌}
카카오페이: kakaopay://transfer?amount={금액}
```

딥링크는 결제 API 연동 아님. 해당 앱 열기만 함.
API 키 불필요, 앱 심사 불필요.

---

## 디자인 토큰

```scss
$bg: #EDE8DF;        // 크림 베이지 배경
$primary: #E8432D;   // 코랄 레드 포인트
$text: #1A1A1A;      // 기본 텍스트
$text-sub: #888888;  // 서브 텍스트
$border: #E0E0E0;    // 보더

$font-sans: 'Pretendard', -apple-system, sans-serif;
$font-mono: 'JetBrains Mono', monospace;
```

---

## 스타일링 규칙

- CSS Modules 방식: 컴포넌트별 `.module.scss` 파일 분리
- 디자인 토큰: `src/styles/_variables.scss` 에서 관리
- 전역 스타일: `src/styles/global.scss`
- AI 느낌 없이 사람이 만든 느낌
- 그라디언트 금지, 쉐도우 최소화
- 폰트 굵기 대비로 계층 표현

---

## 파일 구조

```
src/
  lib/
    firebase.ts       # Firebase 초기화
    settlement.ts     # 정산 알고리즘
  styles/
    _variables.scss
    _mixins.scss
    global.scss
  components/
    HomeScreen/
    CreateRoom/
    ExpenseList/
    AddExpense/
    Settlement/
    shared/           # 공통 컴포넌트
  hooks/
    useRoom.ts
    useExpenses.ts
  types/
    index.ts
  App.tsx
```

---

## 작업 원칙

- 한 번에 다 구현하지 말고 단계별로 완료 후 확인받기
- 각 단계 시작 전 구현 계획 간단히 설명하기
- 디자인은 _design-handoff/ 폴더 핸드오프 파일 최대한 가깝게 재현
- Firebase 키값은 .env 파일에서 import.meta.env로 참조
- 타입 정의 먼저, 구현 나중에

---

## 코드 컨벤션

### 주석 규칙
- 모든 함수·훅 상단에 JSDoc 주석 필수 (`/** ... */`)
- 복잡한 로직에는 인라인 주석 추가
- 당연한 것(what)보다 이유(why) 위주로 작성
  - ❌ `// 배열을 필터링한다`
  - ✅ `// splitWith가 비어 있으면 나눗셈 오류 발생하므로 건너뜀`

### 에러 핸들링 규칙
- Firebase 관련 함수는 반드시 try/catch 또는 onValue error 콜백 포함
- 사용자에게 보여줄 에러 메시지는 한국어로 작성
- 복구 불가능한 에러는 콘솔에도 함께 기록 (`console.error`)

### 타입 규칙
- `any` 사용 금지 — 외부 데이터는 `unknown` 후 타입 가드 또는 명시적 캐스팅
- Firebase 응답 캐스팅 시 반드시 인라인 주석으로 이유 명시
  ```ts
  // Firebase snapshot.val()은 구조가 보장되므로 캐스팅
  const data = snapshot.val() as Omit<Room, 'id'>;
  ```

### 함수 배치 규칙
- 순수 함수(입력 → 출력, 부수효과 없음)는 `utils/`에 위치
- 부수효과(Firebase 읽기/쓰기, localStorage)가 있는 로직은 `hooks/`에 위치
- 함수 하나는 한 가지 역할만 — 역할이 두 개 이상이면 분리

---

## 테스트 실행

```bash
npm run test          # Vitest 단위 테스트 (watch 없이 1회 실행)
npm run test:watch    # Vitest watch 모드
npm run test:coverage # 커버리지 리포트
npm run test:e2e      # Playwright E2E (자동으로 dev 서버 띄움)
```

### 테스트 파일 위치
- 단위 테스트: `src/utils/__tests__/*.test.ts`
- E2E 테스트: `e2e/*.spec.ts`
- Vitest 설정: `vite.config.ts` → `test` 블록
- Playwright 설정: `playwright.config.ts`

### Playwright MCP
`~/.claude/mcp.json` 에 설정되어 있음. Claude Code 재시작 후 `playwright` MCP 도구로 브라우저 자동화 가능.