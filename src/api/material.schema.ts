import { z } from "zod";

export const materialResponseSchema = z.object({
  id: z.string().uuid(),
  materialCode: z.string(),
  materialName: z.string(),
  materialGroupId: z.string().uuid().nullable(),
  materialGroupName: z.string().nullable(),
  defaultUnitId: z.string().uuid().nullable(),
  defaultUnitName: z.string().nullable(),
  defaultYieldPct: z.string(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const materialListSchema = z.array(materialResponseSchema);

export const unitResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const unitListSchema = z.array(unitResponseSchema);
