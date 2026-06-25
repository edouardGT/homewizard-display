import type { EmsReading, P1Reading, PlugReading } from "../devices/types.js";

/** A device as exposed on the dashboard (token stripped, online flag, last-seen). */
export interface LiveDevice {
  name: string;
  type: "p1" | "plug";
  ip: string;
  api: "v1" | "v2";
  icon: string;
  serial: string | null;
  room: string | null;
  online: boolean;
  status?: number;
  lastSeenTs: number | null;
  error?: string;
  data: Record<string, unknown>;
}

export interface LiveState {
  ts: number;
  devices: Map<string, LiveDevice>;
  p1: P1Reading | null;
  ems: EmsReading | null;
  plugTotalW: number;
  p1Online: boolean;
  emsOnline: boolean;
}

/**
 * In-memory snapshot of the latest poll. Keeps the last-good reading per device
 * so the dashboard can show stale-but-labeled data instead of dropping a device
 * when a single poll fails. This also backs offline mode for the PWA.
 */
export class LiveCache {
  private state: LiveState = {
    ts: 0,
    devices: new Map(),
    p1: null,
    ems: null,
    plugTotalW: 0,
    p1Online: false,
    emsOnline: false,
  };

  get(): LiveState {
    return this.state;
  }

  updateP1(reading: P1Reading | null, online: boolean): void {
    if (online && reading) this.state.p1 = reading;
    this.state.p1Online = online;
  }

  updateEms(reading: EmsReading | null, online: boolean): void {
    if (online && reading) this.state.ems = reading;
    this.state.emsOnline = online;
  }

  upsertDevice(device: LiveDevice): void {
    const prev = this.state.devices.get(device.ip);
    if (!device.online && prev) {
      // Keep the last-good data; just mark offline.
      this.state.devices.set(device.ip, {
        ...prev,
        online: false,
        status: device.status,
        error: device.error,
      });
    } else {
      this.state.devices.set(device.ip, device);
    }
  }

  setPlugReadings(readings: Array<{ ip: string; reading: PlugReading | null; online: boolean }>): void {
    let total = 0;
    for (const { reading, online } of readings) {
      if (online && reading?.powerW != null) total += reading.powerW;
    }
    this.state.plugTotalW = total;
  }

  commit(ts: number): void {
    this.state.ts = ts;
  }
}
