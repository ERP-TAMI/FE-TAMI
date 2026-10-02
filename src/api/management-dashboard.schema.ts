import { z } from "zod";
import type { ManagementPurchaseOrderSummaryStatus } from "@/types/management-dashboard";
import type { PoStatus } from "@/types/po";

export const managementDashboardMonthSchema = z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/);
const dashboardYearSchema = z.string().regex(/^(?!0000)\d{4}$/);
const dashboardDateSchema = z
  .string()
  .date()
  .refine((value) => !value.startsWith("0000-"), "Year zero is not supported");
export const dashboardPeriodSchema = z
  .discriminatedUnion("periodType", [
    z.object({ periodType: z.literal("month"), month: managementDashboardMonthSchema }).strict(),
    z.object({ periodType: z.literal("year"), year: dashboardYearSchema }).strict(),
    z
      .object({
        periodType: z.literal("range"),
        fromDate: dashboardDateSchema,
        toDate: dashboardDateSchema,
      })
      .strict(),
    z.object({ periodType: z.literal("all") }).strict(),
  ])
  .superRefine((period, context) => {
    if (period.periodType === "range" && period.fromDate > period.toDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toDate"],
        message: "End date must be on or after start date",
      });
    }
  });

const poStatusSchema = z.enum([
  "draft",
  "pending_rd",
  "in_progress",
  "closed",
  "cancelled",
]) satisfies z.ZodType<PoStatus>;

const dashboardSummarySchema = z
  .object({
    periodType: z.enum(["month", "year", "range", "all"]),
    periodStart: dashboardDateSchema,
    periodEnd: dashboardDateSchema,
    trendGranularity: z.enum(["day", "month", "year"]),
    totalPurchaseOrders: z.number().int().nonnegative(),
    completedPurchaseOrders: z.number().int().nonnegative(),
    cancelledPurchaseOrders: z.number().int().nonnegative(),
    processingPurchaseOrders: z.number().int().nonnegative(),
    overdueProductPurchaseOrders: z.number().int().nonnegative(),
    upcomingProductPurchaseOrders: z.number().int().nonnegative(),
    pendingBomCount: z.number().int().nonnegative(),
    trend: z.array(
      z
        .object({
          period: z.string(),
          received: z.number().int().nonnegative(),
          completed: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    purchaseOrderStatuses: z.array(
      z
        .object({
          status: poStatusSchema,
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    bomRevisionStatuses: z.array(
      z
        .object({
          status: z.enum([
            "wait_nvkh",
            "wait_rd",
            "wait_tpkh_confirm",
            "wait_accounting",
            "wait_sa_approve",
            "closed",
          ]),
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    topCustomers: z.array(
      z
        .object({
          customerName: z.string(),
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    overdueQueue: z.array(
      z
        .object({
          purchaseOrderId: z.string().uuid(),
          poCode: z.string(),
          customerName: z.string(),
          deadline: z.string().date(),
          productCount: z.number().int().positive(),
        })
        .strict(),
    ),
    upcomingQueue: z.array(
      z
        .object({
          purchaseOrderId: z.string().uuid(),
          poCode: z.string(),
          customerName: z.string(),
          deadline: z.string().date(),
          productCount: z.number().int().positive(),
        })
        .strict(),
    ),
    pendingBomQueue: z.array(
      z
        .object({
          bomId: z.string().uuid(),
          bomCode: z.string(),
          productName: z.string(),
          bomType: z.enum(["fit", "po"]),
          status: z.enum([
            "wait_nvkh",
            "wait_rd",
            "wait_tpkh_confirm",
            "wait_accounting",
            "wait_sa_approve",
          ]),
          createdAt: z.string().datetime({ offset: true }),
        })
        .strict(),
    ),
    activeEmployees: z.number().int().nonnegative().optional(),
  })
  .strict();

const dashboardTrendPeriodSchemas = {
  day: dashboardDateSchema,
  month: managementDashboardMonthSchema,
  year: dashboardYearSchema,
} as const;

function validateDashboardTrendPeriods(
  summary: z.infer<typeof dashboardSummarySchema>,
  context: z.RefinementCtx,
) {
  const periodSchema = dashboardTrendPeriodSchemas[summary.trendGranularity];

  summary.trend.forEach(({ period }, index) => {
    if (!periodSchema.safeParse(period).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trend", index, "period"],
        message: `Trend period must match ${summary.trendGranularity} granularity`,
      });
    }
  });
}

export const managementDashboardSummarySchema = dashboardSummarySchema
  .extend({
    activeEmployees: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine(validateDashboardTrendPeriods);

export const businessDashboardSummarySchema = dashboardSummarySchema.superRefine(
  validateDashboardTrendPeriods,
);

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
