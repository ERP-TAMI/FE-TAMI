import { z } from "zod";

export const materialSchema = z.object({
  id: z.string().uuid(),
  materialCode: z.string(),
  materialName: z.string(),
  materialGroupId: z.string().uuid().nullable(),
  defaultUnitId: z.string().uuid(),
  defaultYieldPct: z.number().nonnegative(),
  lastUnitCost: z.number().nonnegative(),
  currentStock: z.number().nonnegative(),
  lowStockThreshold: z.number().nonnegative(),
  materialGroup: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() }).nullable(),
  defaultUnit: z.object({ id: z.string().uuid(), code: z.string(), name: z.string() }).nullable(),
  status: z.enum(["active", "inactive"]),
});

export const materialListSchema = z.array(materialSchema);
