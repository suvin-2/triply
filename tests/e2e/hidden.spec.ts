import { test, expect } from "@playwright/test";
import { createTestRoom, deleteTestRoom } from "./helpers";

const OWNER_TOKEN = "test-owner-token-xyz";

test.describe("숨김/복원/삭제 — TC-500~504", () => {
  /* TC-500: 홈 ⋮ 메뉴 → 숨긴 여행 보기 */
  test("TC-500: 홈 ⋮ 메뉴에서 숨긴 여행 보기로 이동", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "메뉴" }).click();
    await expect(page.getByRole("button", { name: "숨긴 여행 보기" })).toBeVisible();
    await page.getByRole("button", { name: "숨긴 여행 보기" }).click();
    await expect(page).toHaveURL(/\/hidden/);
  });

  /* TC-501: 숨긴 여행 없을 때 빈 상태 메시지 */
  test("TC-501: 숨긴 여행 없을 때 빈 상태 메시지 표시", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("triply_hidden_rooms");
    });
    await page.goto("/hidden");
    await expect(page.getByText(/숨긴 여행이 없어요/)).toBeVisible();
  });

  /* TC-502: 여행 숨기기 — TripScreen ⋮ 메뉴 */
  test("TC-502: TripScreen ⋮ 메뉴 → 이 여행 숨기기 → 홈으로 이동", async ({ page }) => {
    const roomId = await createTestRoom({ name: "숨길여행", members: ["A", "B"] });
    await page.addInitScript((id) => {
      localStorage.setItem("triply_rooms", JSON.stringify([id]));
    }, roomId);
    await page.goto(`/room/${roomId}`);
    await page.getByRole("button", { name: "메뉴" }).click();
    await page.getByRole("button", { name: "이 여행 숨기기" }).click();
    await expect(page).toHaveURL("/");
    // 홈 방 목록에서 사라졌는지 확인
    await expect(page.getByText("숨길여행")).not.toBeVisible();
    await deleteTestRoom(roomId);
  });

  /* TC-503: 숨긴 여행 복원 */
  test("TC-503: 숨긴 여행 복원 후 홈 목록에 다시 표시", async ({ page }) => {
    const roomId = await createTestRoom({ name: "복원할여행", members: ["A", "B"] });
    await page.addInitScript((id) => {
      localStorage.setItem("triply_rooms", JSON.stringify([id]));
      localStorage.setItem("triply_hidden_rooms", JSON.stringify([id]));
    }, roomId);
    await page.goto("/hidden");
    // Firebase 데이터 로드 대기
    await expect(page.getByText("복원할여행")).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "복원" }).click();
    // 복원 후 /hidden에서 사라짐
    await expect(page.getByText("복원할여행")).not.toBeVisible();
    // 홈으로 이동 — page.goto 대신 뒤로가기 버튼 사용
    // (page.goto는 addInitScript를 재실행해 localStorage를 덮어씀)
    await page.getByRole("button", { name: "뒤로" }).click();
    await expect(page).toHaveURL("/");
    // 홈 목록에 다시 표시되는지 확인 (Firebase 로드 대기)
    await expect(page.getByText("복원할여행")).toBeVisible({ timeout: 15000 });
    await deleteTestRoom(roomId);
  });

  /* TC-504: 방장만 삭제 버튼 노출 (정산완료 + ownerToken 일치) */
  test("TC-504: 방장 기기에서 정산완료 방 → 삭제 버튼 노출", async ({ page }) => {
    const roomId = await createTestRoom({
      name: "삭제가능한여행",
      members: ["A", "B"],
      status: "done",
      ownerToken: OWNER_TOKEN,
    });
    await page.addInitScript(
      (args) => {
        const [id, token] = args;
        localStorage.setItem("triply_rooms", JSON.stringify([id]));
        localStorage.setItem(`triply_owner_${id}`, token);
      },
      [roomId, OWNER_TOKEN],
    );
    await page.goto(`/room/${roomId}`);
    await page.getByRole("button", { name: "메뉴" }).click();
    await expect(page.getByRole("button", { name: "이 여행 삭제하기" })).toBeVisible();
    await deleteTestRoom(roomId);
  });

  /* TC-505: 방장이 아닌 기기에서는 삭제 버튼 미노출 */
  test("TC-505: 참여자 기기에서 삭제 버튼 미노출", async ({ page }) => {
    const roomId = await createTestRoom({
      name: "참여자여행",
      members: ["A", "B"],
      status: "done",
      ownerToken: OWNER_TOKEN,
    });
    await page.addInitScript((id) => {
      localStorage.setItem("triply_rooms", JSON.stringify([id]));
      // ownerToken 저장 안함 → 참여자
    }, roomId);
    await page.goto(`/room/${roomId}`);
    await page.getByRole("button", { name: "메뉴" }).click();
    await expect(page.getByRole("button", { name: "이 여행 삭제하기" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "이 여행 숨기기" })).toBeVisible();
    await deleteTestRoom(roomId);
  });

  /* TC-506: active 방은 방장도 삭제 버튼 미노출 */
  test("TC-506: 진행중(active) 방은 방장도 삭제 버튼 미노출", async ({ page }) => {
    const roomId = await createTestRoom({
      name: "진행중여행",
      members: ["A", "B"],
      status: "active",
      ownerToken: OWNER_TOKEN,
    });
    await page.addInitScript(
      (args) => {
        const [id, token] = args;
        localStorage.setItem("triply_rooms", JSON.stringify([id]));
        localStorage.setItem(`triply_owner_${id}`, token);
      },
      [roomId, OWNER_TOKEN],
    );
    await page.goto(`/room/${roomId}`);
    await page.getByRole("button", { name: "메뉴" }).click();
    await expect(page.getByRole("button", { name: "이 여행 삭제하기" })).not.toBeVisible();
    await deleteTestRoom(roomId);
  });

  /* TC-507: 방장이 방 삭제 → 참여자 기기에서 자동 제거 */
  test("TC-507: 방 삭제 후 홈 목록에서 사라짐", async ({ page }) => {
    const roomId = await createTestRoom({
      name: "삭제테스트여행",
      members: ["A", "B"],
      status: "done",
      ownerToken: OWNER_TOKEN,
    });
    await page.addInitScript(
      (args) => {
        const [id, token] = args;
        localStorage.setItem("triply_rooms", JSON.stringify([id]));
        localStorage.setItem(`triply_owner_${id}`, token);
      },
      [roomId, OWNER_TOKEN],
    );
    await page.goto(`/room/${roomId}`);

    // ⋮ → 삭제하기 → 확인 다이얼로그 → 삭제
    await page.getByRole("button", { name: "메뉴" }).click();
    await page.getByRole("button", { name: "이 여행 삭제하기" }).click();
    await expect(page.getByText(/삭제하면 모든 데이터가/)).toBeVisible();
    await page.getByRole("button", { name: "삭제하기" }).click();

    // 홈으로 이동 + 방 사라짐
    await expect(page).toHaveURL("/");
    await expect(page.getByText("삭제테스트여행")).not.toBeVisible();
  });
});
