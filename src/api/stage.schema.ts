import { z } from "zod";

export const stageResponseSchema = z.object({
  id: z.string().uuid(),
  stageCode: z.string(),
  stageName: z.string(),
  description: z.string().nullable(),
  ssv: z.string().regex(/^\d{1,9}(?:\.\d{1,3})?$/),
  status: z.enum(["active", "inactive"]),
});

export const stageListSchema = z.array(stageResponseSchema);
