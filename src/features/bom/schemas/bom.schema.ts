import { z } from "zod";

export const bomMaterialOptionSchema = z.object({
  id: z.string().uuid(),
  materialCode: z.string(),
  materialName: z.string(),
});

export const bomLineSchema = z.object({
  id: z.string().uuid(),
  billOfMaterialId: z.string().uuid(),
  materialId: z.string().uuid(),
  materialNameSnapshot: z.string(),
  materialGroupSnapshot: z.string().nullable(),
  unitSnapshot: z.string(),
  consumptionPerUnit: z.number().positive(),
  unitCost: z.number().positive().nullable(),
  orderIndex: z.number().int().nonnegative(),
});

export const addBomLineFormSchema = z.object({
  materialId: z.string().uuid("Select a material"),
  consumptionPerUnit: z
    .number({ invalid_type_error: "Enter consumption" })
    .positive("Consumption must be greater than zero"),
  unitCost: z
    .number({ invalid_type_error: "Enter a valid cost" })
    .positive("Unit cost must be greater than zero")
    .optional(),
  orderIndex: z.number().int().nonnegative("Order index cannot be negative"),
});

export type AddBomLineFormValues = z.infer<typeof addBomLineFormSchema>;
