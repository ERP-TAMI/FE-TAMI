import { z } from "zod";

export const materialGroupResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const materialGroupListSchema = z.array(materialGroupResponseSchema);
