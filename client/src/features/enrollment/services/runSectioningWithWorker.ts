import { createDraftPlacement } from "./sectioningAlgorithm";
import type {
  SectioningAlgorithmInput,
  DraftPlacement,
} from "../types/sectioning.types";
import type {
  WorkerSectioningMessage,
  WorkerSectioningResponse,
} from "../workers/sectioning.worker";

/**
 * Runs the sectioning distribution algorithm asynchronously using a Web Worker.
 * Completely offloads the heavy mathematical sorting and snake-draft operations
 * from the React UI thread, preventing frame drops and "Page Unresponsive" browser warnings.
 */
export function runSectioningWithWorker(
  input: SectioningAlgorithmInput,
): Promise<DraftPlacement> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") {
      try {
        const draft = createDraftPlacement(input);
        resolve(draft);
      } catch (err) {
        reject(err);
      }
      return;
    }

    try {
      const worker = new Worker(
        new URL("../workers/sectioning.worker.ts", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = (event: MessageEvent<WorkerSectioningResponse>) => {
        worker.terminate();
        if (event.data?.type === "SUCCESS") {
          resolve(event.data.draft);
        } else {
          reject(new Error(event.data?.error || "Sectioning worker failed"));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };

      const msg: WorkerSectioningMessage = {
        type: "RUN_SECTIONING",
        payload: input,
      };
      worker.postMessage(msg);
    } catch {
      // Fallback to synchronous calculation if Worker initialization fails
      try {
        const draft = createDraftPlacement(input);
        resolve(draft);
      } catch (calcErr) {
        reject(calcErr);
      }
    }
  });
}
