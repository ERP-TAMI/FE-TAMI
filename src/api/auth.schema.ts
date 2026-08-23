import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  roleCode: z.string(),
  roleName: z.string(),
  permissions: z.array(z.string()),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
