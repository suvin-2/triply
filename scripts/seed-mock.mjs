/**
 * 앱스토어/플레이스토어 캡쳐용 목업 데이터 시드 스크립트.
 * 기존 목업 데이터를 삭제하고 새 데이터를 Firebase에 직접 씁니다.
 *
 * 실행: node scripts/seed-mock.mjs
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, remove, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBy9Cq1RGvLXX-tkvwSMwZX-lf0T9G1Vn8",
  authDomain: "triply-22680.firebaseapp.com",
  projectId: "triply-22680",
  storageBucket: "triply-22680.firebasestorage.app",
  messagingSenderId: "278582622538",
  appId: "1:278582622538:web:8167dadca90e60c2f269b3",
  databaseURL: "https://triply-22680-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 고정 ID 사용 — 재실행 시 덮어쓰기
const MOCK_ROOM_IDS = {
  jeju: "mock_jeju_2025",
  osaka: "mock_osaka_2025",
  busan: "mock_busan_2025",
};

const now = Date.now();
const days = (n) => n * 24 * 60 * 60 * 1000;

const mockData = {
  // 1. 제주도 봄 여행 — 진행중, 4명, 지출 다양
  [MOCK_ROOM_IDS.jeju]: {
    name: "제주도 봄 여행",
    startDate: "2025-05-15",
    endDate: "2025-05-18",
    members: ["민준", "서연", "지호", "하은"],
    status: "active",
    createdAt: now - days(3),
    inviteCode: "MOCK0001",
    ownerToken: "mock-owner-jeju",
    expenses: {
      e1: {
        title: "게스트하우스 (3박)",
        category: "숙소",
        paidBy: "민준",
        amount: 240000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(3),
      },
      e2: {
        title: "흑돼지 저녁식사",
        category: "식사",
        paidBy: "서연",
        amount: 96000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(2) - 3600000 * 6,
      },
      e3: {
        title: "렌터카 (3일)",
        category: "교통",
        paidBy: "지호",
        amount: 180000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(3) + 3600000,
      },
      e4: {
        title: "성산일출봉 입장",
        category: "관광",
        paidBy: "하은",
        amount: 10000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(2),
      },
      e5: {
        title: "카페 아침",
        category: "식사",
        paidBy: "민준",
        amount: 52000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(1) - 3600000 * 8,
      },
      e6: {
        title: "해산물 점심",
        category: "식사",
        paidBy: "지호",
        amount: 88000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(1) - 3600000 * 4,
      },
      e7: {
        title: "공항 버스",
        category: "교통",
        paidBy: "서연",
        amount: 16000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(3) - 3600000,
      },
      e8: {
        title: "한라산 등반 간식",
        category: "기타",
        paidBy: "하은",
        amount: 34000,
        splitWith: ["민준", "서연", "지호", "하은"],
        createdAt: now - days(1),
      },
    },
  },

  // 2. 오사카 여행 — 정산완료, 3명
  [MOCK_ROOM_IDS.osaka]: {
    name: "오사카 여행",
    startDate: "2025-04-20",
    endDate: "2025-04-22",
    members: ["수진", "예린", "태양"],
    status: "done",
    createdAt: now - days(37),
    inviteCode: "MOCK0002",
    ownerToken: "mock-owner-osaka",
    expenses: {
      e1: {
        title: "호텔 (2박)",
        category: "숙소",
        paidBy: "수진",
        amount: 210000,
        splitWith: ["수진", "예린", "태양"],
        createdAt: now - days(37),
      },
      e2: {
        title: "라멘 저녁",
        category: "식사",
        paidBy: "예린",
        amount: 54000,
        splitWith: ["수진", "예린", "태양"],
        createdAt: now - days(36),
      },
      e3: {
        title: "오사카 1일권 (지하철)",
        category: "교통",
        paidBy: "태양",
        amount: 39000,
        splitWith: ["수진", "예린", "태양"],
        createdAt: now - days(37),
      },
      e4: {
        title: "도톤보리 간식",
        category: "식사",
        paidBy: "수진",
        amount: 42000,
        splitWith: ["수진", "예린", "태양"],
        createdAt: now - days(36),
      },
      e5: {
        title: "유니버설 스튜디오",
        category: "관광",
        paidBy: "예린",
        amount: 165000,
        splitWith: ["수진", "예린", "태양"],
        createdAt: now - days(35),
      },
    },
  },

  // 3. 강릉 바다 여행 — 진행중, 5명
  [MOCK_ROOM_IDS.busan]: {
    name: "강릉 바다 여행",
    startDate: "2025-05-24",
    endDate: "2025-05-25",
    members: ["동현", "소윤", "지윤", "현서", "민서"],
    status: "active",
    createdAt: now - days(3),
    inviteCode: "MOCK0003",
    ownerToken: "mock-owner-busan",
    expenses: {
      e1: {
        title: "펜션 (1박)",
        category: "숙소",
        paidBy: "동현",
        amount: 300000,
        splitWith: ["동현", "소윤", "지윤", "현서", "민서"],
        createdAt: now - days(3),
      },
      e2: {
        title: "막국수 점심",
        category: "식사",
        paidBy: "소윤",
        amount: 65000,
        splitWith: ["동현", "소윤", "지윤", "현서", "민서"],
        createdAt: now - days(2),
      },
      e3: {
        title: "KTX (왕복)",
        category: "교통",
        paidBy: "현서",
        amount: 175000,
        splitWith: ["동현", "소윤", "지윤", "현서", "민서"],
        createdAt: now - days(3) - 3600000,
      },
      e4: {
        title: "커피 & 디저트",
        category: "식사",
        paidBy: "민서",
        amount: 55000,
        splitWith: ["동현", "소윤", "지윤", "현서", "민서"],
        createdAt: now - days(2) + 3600000 * 2,
      },
    },
  },
};

async function seedMockData() {
  console.log("🌱 기존 목업 데이터 삭제 중...");

  // 기존 목업 삭제
  for (const id of Object.values(MOCK_ROOM_IDS)) {
    await remove(ref(db, `rooms/${id}`));
  }

  console.log("✅ 삭제 완료. 새 목업 데이터 작성 중...\n");

  // 새 목업 데이터 쓰기
  for (const [id, data] of Object.entries(mockData)) {
    await set(ref(db, `rooms/${id}`), data);
    console.log(`✅ ${data.name} (${id})`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 브라우저 콘솔에 아래 코드를 붙여넣기 하세요:\n");
  console.log(
    `localStorage.setItem('triply_rooms', JSON.stringify(${JSON.stringify(Object.values(MOCK_ROOM_IDS))}));`,
  );
  console.log("\n그 다음 페이지를 새로고침하면 목업 데이터가 표시됩니다.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
}

seedMockData().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});
