import { z } from "zod";

export const managementDashboardSummarySchema = z
  .object({
    month: z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/),
    totalPurchaseOrders: z.number().int().nonnegative(),
    completedPurchaseOrders: z.number().int().nonnegative(),
    overduePurchaseOrders: z.number().int().nonnegative(),
    activeEmployees: z.number().int().nonnegative(),
  })
  .strict();
