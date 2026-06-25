/** Pick an emoji icon for a device based on its name. Moved from the old server.js. */
export function iconForDeviceName(name = ""): string {
  const n = name.toLowerCase();

  if (n.includes("tv") || n.includes("television")) return "📺";
  if (n.includes("server") || n.includes("rack") || n.includes("nas")) return "🖥️";
  if (n.includes("bedroom") || n.includes("bed")) return "🛏️";
  if (n.includes("wash") || n.includes("washing")) return "🧺";
  if (n.includes("dryer") || n.includes("droog")) return "🌬️";
  if (n.includes("dish") || n.includes("vaat")) return "🍽️";
  if (n.includes("coffee") || n.includes("koffie")) return "☕";
  if (n.includes("fridge") || n.includes("koel")) return "🧊";
  if (n.includes("freezer") || n.includes("vries")) return "❄️";
  if (n.includes("heat") || n.includes("pump") || n.includes("boiler")) return "🔥";
  if (n.includes("office") || n.includes("desk")) return "💻";
  if (n.includes("ev") || n.includes("charger") || n.includes("tesla") || n.includes("car")) return "🚗";
  if (n.includes("lamp") || n.includes("light")) return "💡";
  if (n.includes("router") || n.includes("wifi") || n.includes("network")) return "📡";
  if (n.includes("printer")) return "🖨️";

  return "🔌";
}
