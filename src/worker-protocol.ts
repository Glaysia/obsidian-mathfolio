// SPDX-License-Identifier: AGPL-3.0-only
import { isRecord } from "./settings";

type WorkerJob = Record<string, unknown> & { generation: number; source: string; automatic: boolean };
export type WorkerInput = [WorkerJob, unknown];
export function isWorkerInput(value: unknown): value is WorkerInput {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const job: unknown = value[0];
  return isRecord(job) && typeof job.generation === "number" && Number.isSafeInteger(job.generation) && job.generation >= 0
    && typeof job.source === "string" && typeof job.automatic === "boolean"
    && Array.isArray(job.requests) && Array.isArray(job.plots);
}
