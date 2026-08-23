import { z } from "zod";

export const materialResponseSchema = z.object({
  id: z.string().uuid(),
  materialCode: z.string(),
  materialName: z.string(),
  materialGroupId: z.string().uuid().nullable(),
  materialGroupName: z.string().nullable(),
  defaultUnitId: z.string().uuid().nullable(),
  defaultUnitCode: z.string().nullable(),
  defaultUnitName: z.string().nullable(),
  defaultYieldPct: z.string(),
  lastUnitCost: z.string(),
  currentStock: z.string(),
  lowStockThreshold: z.string(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const materialListSchema = z.array(materialResponseSchema);

export const unitResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  decimalScale: z.number().int().min(0).max(6),
  status: z.enum(["active", "inactive"]),
});

export const unitListSchema = z.array(unitResponseSchema);
