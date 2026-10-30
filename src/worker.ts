// SPDX-License-Identifier: AGPL-3.0-only
import init, { CalculatorWorker } from "@mathfolio/wasm-sdk/bindings";
import { isWorkerInput } from "./worker-protocol";
import { errorMessage } from "./settings";
declare const MATHFOLIO_WASM_URL: string;

const ready = init({ module_or_path: MATHFOLIO_WASM_URL }).then(() => new CalculatorWorker());
self.onmessage = async (event: MessageEvent<unknown>) => {
  const data = event.data;
  const generation = isWorkerInput(data) ? data[0].generation : 0;
  try {
    if (!isWorkerInput(data)) throw new Error("Invalid Mathfolio calculation request");
    const worker = await ready;
    self.postMessage({ kind: "started", generation });
    // wasm-bindgen's generic JsValue boundary returns any; keep it unknown here.
    // The Rust transport validates the full reply before installing results.
    const reply: unknown = worker.run(data);
    self.postMessage(reply);
  } catch (error: unknown) {
    self.postMessage({ generation, updates: [], plots: [], error: errorMessage(error), cancelled: false });
  }
};
