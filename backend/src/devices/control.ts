import { getJson } from "./httpClient.js";
import { fetch } from "undici";
import type { ReadResult } from "./types.js";

export interface PlugState {
  powerOn: boolean | null;
  switchLock: boolean | null;
  brightness: number | null;
}

interface StateRaw {
  power_on?: boolean;
  switch_lock?: boolean;
  brightness?: number;
}

/** Read a socket's switch state (v1 `/api/v1/state`). */
export async function readPlugState(ip: string): Promise<ReadResult<PlugState>> {
  const res = await getJson<StateRaw>(`http://${ip}/api/v1/state`, { timeoutMs: 2000 });
  if (!res.online || !res.data) return { online: false, status: res.status, error: res.error };
  return {
    online: true,
    status: res.status,
    data: {
      powerOn: typeof res.data.power_on === "boolean" ? res.data.power_on : null,
      switchLock: typeof res.data.switch_lock === "boolean" ? res.data.switch_lock : null,
      brightness: typeof res.data.brightness === "number" ? res.data.brightness : null,
    },
  };
}

export interface StatePatch {
  power_on?: boolean;
  switch_lock?: boolean;
  brightness?: number;
}

/** Write a socket's switch state (PUT `/api/v1/state`). Returns the new state. */
export async function setPlugState(ip: string, patch: StatePatch): Promise<ReadResult<PlugState>> {
  try {
    const response = await fetch(`http://${ip}/api/v1/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(3000),
    });
    const data = (await response.json()) as StateRaw;
    return {
      online: response.ok,
      status: response.status,
      data: {
        powerOn: typeof data.power_on === "boolean" ? data.power_on : null,
        switchLock: typeof data.switch_lock === "boolean" ? data.switch_lock : null,
        brightness: typeof data.brightness === "number" ? data.brightness : null,
      },
    };
  } catch (error) {
    return { online: false, error: error instanceof Error ? error.message : String(error) };
  }
}
