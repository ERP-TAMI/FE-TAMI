import apiClient from "@/lib/apiClient";
import type { MaterialStatus, Unit } from "@/types/material";
import { unitListSchema } from "./material.schema";

const resource = "/masters/units";

export const unitApi = {
  async list(status?: MaterialStatus): Promise<Unit[]> {
    const response = await apiClient.get<Unit[]>(resource, {
      params: status ? { status } : undefined,
    });
    return unitListSchema.parse(response.data);
  },
};
