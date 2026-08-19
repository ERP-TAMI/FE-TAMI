import { z } from "zod";

const numericField = z
  .number({ invalid_type_error: "Enter a number" })
  .finite()
  .min(0, "Value cannot be negative");

export const materialSizeSchema = z.object({
  id: z.string().uuid(),
  materialId: z.string().uuid(),
  sizeCode: z.string(),
  barcode: z.string().nullable(),
  unitCost: z.number().nonnegative(),
  currentStock: z.number().nonnegative(),
  lowStockThreshold: z.number().nonnegative(),
  status: z.enum(["active", "inactive"]),
});

export const materialSizeFormSchema = z.object({
  sizeCode: z.string().trim().min(1, "Size is required").max(20),
  barcode: z.string().trim().max(50),
  unitCost: numericField,
  currentStock: numericField,
  lowStockThreshold: numericField,
});

export type MaterialSizeFormValues = z.infer<typeof materialSizeFormSchema>;
