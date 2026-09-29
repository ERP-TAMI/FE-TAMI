import { z } from "zod";

export const purchaseOrderModeSchema = z.enum(["READ_ONLY", "FULL_ACCESS"]);

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  roleCode: z.string(),
  roleName: z.string(),
  permissions: z.array(z.string()),
  purchaseOrderMode: purchaseOrderModeSchema,
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

export const passwordSetupValidationSchema = z.object({
  valid: z.literal(true),
  expiresAt: z.string().datetime(),
});

export const passwordResetAcceptedSchema = z.object({
  status: z.literal("pending"),
});
