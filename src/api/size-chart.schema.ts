import { z } from "zod";

export const sizeChartResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  sizes: z.array(z.string().min(1).max(30)).min(1),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const sizeChartListSchema = z.array(sizeChartResponseSchema);

export const sizeChartListResponseSchema = z.object({
  data: sizeChartListSchema,
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().positive(),
  }),
});
