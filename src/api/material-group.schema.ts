import { z } from "zod";

export const materialGroupResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const materialGroupListSchema = z.array(materialGroupResponseSchema);

export const materialGroupListResponseSchema = z.object({
  data: materialGroupListSchema,
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().positive(),
  }),
});
