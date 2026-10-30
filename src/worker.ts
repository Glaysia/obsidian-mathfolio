// SPDX-License-Identifier: AGPL-3.0-only
import init, { CalculatorWorker } from "@mathfolio/wasm-sdk/bindings";
declare const MATHFOLIO_WASM_URL: string;

const ready = init({ module_or_path: MATHFOLIO_WASM_URL }).then(() => new CalculatorWorker());
self.onmessage = async ({ data }) => {
  const generation = data?.[0]?.generation ?? 0;
  try {
    const worker = await ready;
    self.postMessage({ kind: "started", generation });
    self.postMessage(worker.run(data));
  } catch (error) {
    self.postMessage({ generation, updates: [], plots: [], error: String(error), cancelled: false });
  }
};
