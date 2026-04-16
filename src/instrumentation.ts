export async function register() {
  // Node 런타임에서만 실행 (Edge·브라우저 제외)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startScheduler } = await import("@/lib/pricing/scheduler");
  startScheduler();
}
