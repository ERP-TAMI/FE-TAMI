import { z } from "zod";
import apiClient from "@/lib/apiClient";
import { bomLineSchema, bomMaterialOptionSchema } from "../schemas/bom.schema";
import type { BomLine, BomMaterialOption, CreateBomLineInput } from "../types/bom.types";

export const bomApi = {
  async listMaterialOptions(search: string): Promise<BomMaterialOption[]> {
    const response = await apiClient.get("/masters/materials", {
      params: { status: "active", ...(search ? { search } : {}) },
    });
    return z.array(bomMaterialOptionSchema).parse(response.data);
  },

  async listLines(bomId: string): Promise<BomLine[]> {
    const response = await apiClient.get(`/boms/${bomId}/lines`);
    return z.array(bomLineSchema).parse(response.data);
  },

  async addLine(bomId: string, input: CreateBomLineInput): Promise<BomLine> {
    const response = await apiClient.post(`/boms/${bomId}/lines`, input);
    return bomLineSchema.parse(response.data);
  },
};
