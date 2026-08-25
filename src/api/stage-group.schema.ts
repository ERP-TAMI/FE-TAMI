import { z } from "zod";

const stageGroupSummarySchema = z.object({
  id: z.string().uuid(),
  groupCode: z.string(),
  groupName: z.string(),
  description: z.string().nullable(),
  status: z.enum(["active", "inactive"]),
  itemCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const stageGroupItemSchema = z.object({
  id: z.string().uuid(),
  itemName: z.string().min(1),
  description: z.string().nullable(),
  ssv: z.string().regex(/^\d{1,9}(?:\.\d{1,3})?$/),
  status: z.enum(["active", "inactive"]),
  orderIndex: z.number().int().nonnegative(),
});

export const stageGroupResponseSchema = stageGroupSummarySchema.extend({
  items: z.array(stageGroupItemSchema),
});

export const stageGroupListSchema = z.array(stageGroupSummarySchema);
