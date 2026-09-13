import { z } from "zod";

export const userRoleCodeSchema = z.enum(["SA", "TPKH", "NVKH", "RD", "ACCOUNTING", "IT"]);
export const userAccountStatusSchema = z.enum(["active", "locked", "pending_setup", "inactive"]);
export const passwordSetupEmailStatusSchema = z.enum(["pending", "sent", "failed"]);

export const userListItemSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z
    .object({
      code: userRoleCodeSchema,
      name: z.string(),
    })
    .nullable(),
  accountStatus: userAccountStatusSchema,
  passwordSetupRequired: z.boolean(),
  passwordSetupEmailStatus: passwordSetupEmailStatusSchema.nullable().optional().default(null),
  passwordSetupEmailAttemptedAt: z.string().datetime().nullable().optional().default(null),
});

export const createUserResponseSchema = z.object({
  user: userListItemSchema,
  invitationStatus: z.enum(["pending", "sent", "failed"]),
});

export const updateUserResponseSchema = z.object({
  user: userListItemSchema,
  invitationStatus: z.enum(["pending", "sent", "failed"]).nullable(),
});

export const invitationResponseSchema = z.object({
  invitationStatus: z.enum(["sent", "failed"]),
});

export const accountStatusResponseSchema = z.object({
  user: userListItemSchema,
});

export const passwordResetResponseSchema = z.object({
  user: userListItemSchema,
  invitationStatus: z.literal("pending"),
});

export const userListResponseSchema = z.object({
  data: z.array(userListItemSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().positive(),
  }),
});
