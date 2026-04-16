import { PortfolioValueChart } from "@/components/blocks/PortfolioValueChart";
import { getValueSeries } from "@/lib/data";

export async function PortfolioValueSection() {
  const data = await getValueSeries();
  return <PortfolioValueChart data={data} />;
}
