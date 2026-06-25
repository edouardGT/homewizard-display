import { Card } from "../components/ui/Card";
import { Tile } from "../components/ui/Tile";
import { cubicMeters } from "../lib/format";
import type { Summary } from "../types/api";

export function UtilitiesCard({ summary }: { summary: Summary }) {
  return (
    <Card title="Utilities" icon="🚰">
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Gas meter" value={cubicMeters(summary.gasM3)} icon="🔥" />
        <Tile label="Water meter" value={cubicMeters(summary.waterM3)} icon="💧" accent="house" />
      </div>
    </Card>
  );
}
