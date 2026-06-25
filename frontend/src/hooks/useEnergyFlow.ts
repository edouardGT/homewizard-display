import type { Summary } from "../types/api";

export interface FlowEdge {
  active: boolean;
  /** Magnitude in watts (absolute). */
  watts: number;
}

export interface EnergyFlow {
  /** Grid → House (import). */
  gridToHouse: FlowEdge;
  /** House → Grid (export). */
  houseToGrid: FlowEdge;
  /** Solar → House. */
  solarToHouse: FlowEdge;
  /** Battery → House (discharge). */
  batteryToHouse: FlowEdge;
  /** House → Battery (charge). */
  houseToBattery: FlowEdge;
  houseW: number;
}

const edge = (active: boolean, watts: number): FlowEdge => ({ active, watts: Math.abs(watts) });

/**
 * Derive flow directions/magnitudes from the live summary.
 * Sign conventions: grid power > 0 = importing; battery power > 0 = discharging.
 */
export function deriveEnergyFlow(summary: Summary | undefined): EnergyFlow {
  const grid = summary?.powerW ?? 0;
  const pv = Math.max(summary?.pvPowerW ?? 0, 0);
  const batt = summary?.batteryPowerW ?? 0;

  const gridImport = Math.max(grid, 0);
  const gridExport = Math.max(-grid, 0);
  const battDischarge = Math.max(batt, 0);
  const battCharge = Math.max(-batt, 0);

  // House consumption ≈ import + solar + battery discharge − export − battery charge.
  const houseW = Math.max(gridImport + pv + battDischarge - gridExport - battCharge, 0);

  return {
    gridToHouse: edge(gridImport > 1, gridImport),
    houseToGrid: edge(gridExport > 1, gridExport),
    solarToHouse: edge(pv > 1, pv),
    batteryToHouse: edge(battDischarge > 1, battDischarge),
    houseToBattery: edge(battCharge > 1, battCharge),
    houseW,
  };
}
