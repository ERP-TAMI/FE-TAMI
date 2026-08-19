import { z } from "zod";

export const materialSchema = z.object({
  id: z.string().uuid(),
  materialCode: z.string(),
  materialName: z.string(),
  materialGroupId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

export const materialListSchema = z.array(materialSchema);
