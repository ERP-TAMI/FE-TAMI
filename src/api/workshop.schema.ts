import { z } from "zod";
import { WORKSHOP_CAPACITY_MAX } from "@/types/workshop";

export const workshopResponseSchema = z.object({
  id: z.string().uuid(),
  workshopCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  manager: z.string().max(200).nullable(),
  location: z.string().max(255).nullable(),
  capacity: z.number().int().nonnegative().max(WORKSHOP_CAPACITY_MAX),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const workshopListSchema = z.array(workshopResponseSchema);
