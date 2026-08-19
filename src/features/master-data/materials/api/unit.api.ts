import apiClient from "@/lib/apiClient";
import { z } from "zod";
import type { MaterialLookup } from "../types/material.types";

const unitSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  status: z.literal("active"),
});

export const unitApi = {
  async listActive(): Promise<MaterialLookup[]> {
    const response = await apiClient.get<unknown[]>("/masters/units", {
      params: { status: "active" },
    });
    return z
      .array(unitSchema)
      .parse(response.data)
      .map(({ id, code, name }) => ({ id, code, name }));
  },
};
