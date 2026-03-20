import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppHeader } from "../components/app-header";
import { FormationGrid } from "../components/formation/formation-grid";
import { InventoryPanel } from "../components/formation/inventory-panel";
import { Card, CardContent } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { MonoLabel } from "../components/ui/mono-label";

export function PageFormation() {
  const formation = useQuery(api.formations.getFormation);
  const inventory = useQuery(api.formations.getInventory);

  if (formation === undefined || inventory === undefined) {
    return <LoadingSpinner label="LOADING_FORMATION" />;
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-240 px-8 py-16">
        <MonoLabel size="md" tone="muted" tracking="wider">
          // FORMATION
        </MonoLabel>

        <Card className="animate-stamp mt-6">
          <CardContent className="flex flex-col gap-8">
            {formation !== null ? (
              <FormationGrid positions={formation.positions} />
            ) : (
              <MonoLabel tone="dim">NO FORMATION FOUND</MonoLabel>
            )}

            <InventoryPanel pieces={inventory ?? []} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
