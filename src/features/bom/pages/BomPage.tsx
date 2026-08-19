import { useState } from "react";
import { z } from "zod";
import { Alert, Button, Input } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { BomLineTable } from "../components/BomLineTable";
import { BomMaterialSelector } from "../components/BomMaterialSelector";
import { useBomLines } from "../hooks/useBomLines";

const bomIdSchema = z.string().trim().uuid("Enter a valid BOM UUID");

export default function BomPage() {
  const [draftBomId, setDraftBomId] = useState("");
  const [bomId, setBomId] = useState<string>();
  const [bomIdError, setBomIdError] = useState("");
  const lines = useBomLines(bomId);

  const openBom = () => {
    const result = bomIdSchema.safeParse(draftBomId);
    if (!result.success) {
      setBomIdError(result.error.issues[0]?.message ?? "Invalid BOM UUID");
      return;
    }
    setBomIdError("");
    setBomId(result.data);
  };

  return (
    <>
      <PageMeta title="BOM Materials | TAMI ERP" description="Manage BOM material lines" />
      <section aria-labelledby="bom-title" className="space-y-6">
        <div>
          <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
            Bill of materials
          </p>
          <h1
            id="bom-title"
            className="text-title-md mt-2 font-semibold text-gray-900 dark:text-white"
          >
            BOM material lines
          </h1>
          <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
            Open an existing BOM to add Active materials and review saved snapshots.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 sm:flex-row">
          <div className="w-full sm:max-w-lg">
            <Input
              label="BOM ID"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={draftBomId}
              error={bomIdError}
              onChange={(event) => setDraftBomId(event.target.value)}
            />
          </div>
          <Button onClick={openBom}>Open BOM</Button>
        </div>
        {bomId && (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <BomMaterialSelector bomId={bomId} />
            </div>
            <section aria-labelledby="bom-lines-title" className="space-y-4">
              <h2
                id="bom-lines-title"
                className="text-theme-lg font-semibold text-gray-900 dark:text-white"
              >
                Saved material snapshots
              </h2>
              {lines.isLoading && (
                <div aria-busy="true" aria-label="Loading BOM lines" className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                    />
                  ))}
                </div>
              )}
              {lines.isError && (
                <Alert variant="error" title="Unable to load BOM lines">
                  Check that the BOM exists and try again.{" "}
                  <Button variant="ghost" size="sm" onClick={() => void lines.refetch()}>
                    Retry BOM lines
                  </Button>
                </Alert>
              )}
              {lines.data && <BomLineTable lines={lines.data} />}
            </section>
          </>
        )}
      </section>
    </>
  );
}
