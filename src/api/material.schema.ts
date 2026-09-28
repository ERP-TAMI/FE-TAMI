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

const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().positive(),
});

export const materialListResponseSchema = z.object({
  data: materialListSchema,
  meta: paginationMetaSchema,
});

export const unitResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const unitListSchema = z.array(unitResponseSchema);

export const unitListResponseSchema = z.object({
  data: unitListSchema,
  meta: paginationMetaSchema,
});
