import { KpiCard } from "@/components/blocks/KpiCard";
import { getKpis } from "@/lib/data";

export async function KpiSection() {
  const kpis = await getKpis();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <KpiCard key={k.title} {...k} />
      ))}
    </div>
  );
}
