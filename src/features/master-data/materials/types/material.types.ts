export type MaterialStatus = "active" | "inactive";

export type Material = {
  id: string;
  materialCode: string;
  materialName: string;
  materialGroupId: string;
  status: MaterialStatus;
};

export type MaterialInput = Pick<Material, "materialCode" | "materialName" | "materialGroupId">;
