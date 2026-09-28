import { z } from "zod";
import type { ManagementPurchaseOrderSummaryStatus } from "@/types/management-dashboard";
import type { PoStatus } from "@/types/po";

export const managementDashboardMonthSchema = z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/);

export const managementDashboardSummarySchema = z
  .object({
    month: managementDashboardMonthSchema,
    totalPurchaseOrders: z.number().int().nonnegative(),
    completedPurchaseOrders: z.number().int().nonnegative(),
    overduePurchaseOrders: z.number().int().nonnegative(),
    activeEmployees: z.number().int().nonnegative(),
  })
  .strict();

const poStatusSchema = z.enum([
  "draft",
  "pending_rd",
  "in_progress",
  "closed",
  "cancelled",
]) satisfies z.ZodType<PoStatus>;

const managementPurchaseOrderSummaryStatusSchema = z.enum([
  "not_completed",
  "completed",
  "overdue",
  "cancelled",
]) satisfies z.ZodType<ManagementPurchaseOrderSummaryStatus>;

export const managementPurchaseOrdersOverviewSchema = z
  .object({
    month: managementDashboardMonthSchema,
    totalPurchaseOrders: z.number().int().nonnegative(),
    overduePurchaseOrders: z.number().int().nonnegative(),
    upcomingPurchaseOrders: z.number().int().nonnegative(),
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          poCode: z.string(),
          customerNameSnapshot: z.string(),
          receivedDate: z.string().date(),
          deadline: z.string().date(),
          status: poStatusSchema,
          managementStatus: managementPurchaseOrderSummaryStatusSchema.optional(),
          daysToDeadline: z.number().int().optional(),
        })
        .strict(),
    ),
    meta: z
      .object({
        total: z.number().int().nonnegative(),
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        totalPages: z.number().int().positive(),
      })
      .strict(),
  })
  .strict();
