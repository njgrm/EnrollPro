import { createDraftPlacement } from "../services/sectioningAlgorithm";
import type { SectioningAlgorithmInput, DraftPlacement } from "../types/sectioning.types";

export interface WorkerSectioningMessage {
  type: "RUN_SECTIONING";
  payload: SectioningAlgorithmInput;
}

export type WorkerSectioningResponse =
  | { type: "SUCCESS"; draft: DraftPlacement }
  | { type: "ERROR"; error: string };

self.onmessage = (event: MessageEvent<WorkerSectioningMessage>) => {
  if (event.data?.type === "RUN_SECTIONING") {
    try {
      const draft = createDraftPlacement(event.data.payload);
      const response: WorkerSectioningResponse = { type: "SUCCESS", draft };
      self.postMessage(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error in sectioning worker";
      const response: WorkerSectioningResponse = { type: "ERROR", error: errorMessage };
      self.postMessage(response);
    }
  }
};
