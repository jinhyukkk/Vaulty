import { AllocationChart } from "@/components/blocks/AllocationChart";
import { getAllocation } from "@/lib/data";

export async function AllocationSection() {
  const data = await getAllocation();
  return <AllocationChart data={data} />;
}
