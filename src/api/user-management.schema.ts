import { z } from "zod";

export const userRoleCodeSchema = z.enum(["SA", "TPKH", "NVKH", "RD", "ACCOUNTING", "IT"]);
export const userAccountStatusSchema = z.enum(["active", "locked", "inactive"]);

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
