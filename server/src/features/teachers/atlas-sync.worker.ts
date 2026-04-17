import { processPendingAtlasSyncEvents } from "./atlas-sync.service.js";

let workerTimer: NodeJS.Timeout | null = null;
let isProcessing = false;

function getRetryIntervalMs(): number {
  const configured = Number(
    process.env.ATLAS_SYNC_RETRY_INTERVAL_MS ?? "15000",
  );
  return Number.isFinite(configured) && configured > 0 ? configured : 15_000;
}

export function startAtlasSyncRetryWorker() {
  if (process.env.ATLAS_SYNC_WORKER_DISABLED === "true") {
    return;
  }

  if (workerTimer) {
    return;
  }

  workerTimer = setInterval(async () => {
    if (isProcessing) {
      return;
    }

    isProcessing = true;
    try {
      await processPendingAtlasSyncEvents();
    } catch (error: any) {
      console.error(
        "[ATLAS Sync] Retry worker error:",
        error?.message || error,
      );
    } finally {
      isProcessing = false;
    }
  }, getRetryIntervalMs());
}

export function stopAtlasSyncRetryWorker() {
  if (!workerTimer) {
    return;
  }

  clearInterval(workerTimer);
  workerTimer = null;
}
