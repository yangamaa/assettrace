import { AssetTable } from "@/components/assets/asset-table";
import { dataRepository, requireUser } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await requireUser();
  const repo = dataRepository();
  const [assets, profiles] = await Promise.all([
    repo.listAssets(user.company_id),
    repo.listProfiles(user.company_id),
  ]);

  return <AssetTable assets={assets} profiles={profiles} />;
}
