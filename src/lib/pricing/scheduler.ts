import "server-only";

import cron, { type ScheduledTask } from "node-cron";

import { refreshAll } from "./refresh";

// 전역 심볼로 HMR·중복 등록 방지
const STATE_KEY = "__vaultlySchedulerTasks";
type Globals = typeof globalThis & { [STATE_KEY]?: ScheduledTask[] };

const KST = "Asia/Seoul";

function log(msg: string, extra?: unknown) {
  const ts = new Date().toISOString();
  if (extra !== undefined) {
    console.log(`[scheduler ${ts}] ${msg}`, extra);
  } else {
    console.log(`[scheduler ${ts}] ${msg}`);
  }
}

async function runRefresh(tag: string) {
  try {
    const s = await refreshAll();
    log(`${tag} refreshAll done`, s);
  } catch (e) {
    log(`${tag} refreshAll error: ${(e as Error).message}`);
  }
}

export function startScheduler() {
  const g = globalThis as Globals;
  if (g[STATE_KEY]) return; // 중복 방지

  const tasks: ScheduledTask[] = [];

  // 국내/해외 주식 — 매 영업일 장 마감 후 16:10 KST
  tasks.push(
    cron.schedule(
      "10 16 * * 1-5",
      () => {
        void runRefresh("equity-close");
      },
      { timezone: KST },
    ),
  );
  // 해외 미국장 — 다음날 07:30 KST (US close + 여유)
  tasks.push(
    cron.schedule(
      "30 7 * * 2-6",
      () => {
        void runRefresh("us-close");
      },
      { timezone: KST },
    ),
  );
  // 암호화폐·환율 — 5분마다
  tasks.push(
    cron.schedule(
      "*/5 * * * *",
      () => {
        void runRefresh("crypto-fx");
      },
      { timezone: KST },
    ),
  );

  g[STATE_KEY] = tasks;
  log(`started ${tasks.length} tasks`);

  // 부팅 직후 1회 초기 갱신 (비동기·실패해도 무시)
  void runRefresh("boot");
}
