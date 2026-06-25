import { fetch, Agent } from "undici";
import type { ReadResult } from "./types.js";

/**
 * The P1 v2 API serves HTTPS with a self-signed certificate, so it needs an
 * agent that skips cert verification. This is applied ONLY to the P1 host —
 * plug (v1) and EMS calls use plain HTTP and the default dispatcher.
 */
const insecureAgent = new Agent({
  connect: { rejectUnauthorized: false },
});

const DEFAULT_TIMEOUT_MS = 2500;

interface GetOptions {
  insecure?: boolean;
  token?: string;
  timeoutMs?: number;
}

/** GET JSON from a device, returning a ReadResult that never throws. */
export async function getJson<T>(url: string, opts: GetOptions = {}): Promise<ReadResult<T>> {
  try {
    const response = await fetch(url, {
      dispatcher: opts.insecure ? insecureAgent : undefined,
      headers: opts.token
        ? { Authorization: `Bearer ${opts.token}`, "X-Api-Version": "2" }
        : {},
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });

    const data = (await response.json()) as T;
    return { online: response.ok, status: response.status, data };
  } catch (error) {
    return { online: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
export { num };
