import apiClient from "@/lib/apiClient";
import { z } from "zod";
import { materialSizeSchema } from "../schemas/material-size.schema";
import type {
  MaterialSize,
  MaterialSizeInput,
  MaterialSizeStatus,
} from "../types/material-size.types";

const path = (materialId: string) => `/masters/materials/${materialId}/sizes`;
export const materialSizeApi = {
  async list(materialId: string): Promise<MaterialSize[]> {
    return z.array(materialSizeSchema).parse((await apiClient.get(path(materialId))).data);
  },
  async create(materialId: string, input: MaterialSizeInput): Promise<MaterialSize> {
    return materialSizeSchema.parse((await apiClient.post(path(materialId), input)).data);
  },
  async update(
    materialId: string,
    id: string,
    input: Partial<MaterialSizeInput>,
  ): Promise<MaterialSize> {
    return materialSizeSchema.parse(
      (await apiClient.patch(`${path(materialId)}/${id}`, input)).data,
    );
  },
  async updateStatus(
    materialId: string,
    id: string,
    status: MaterialSizeStatus,
  ): Promise<MaterialSize> {
    return materialSizeSchema.parse(
      (await apiClient.patch(`${path(materialId)}/${id}/status`, { status })).data,
    );
  },
};
