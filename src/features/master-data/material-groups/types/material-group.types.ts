export type MaterialGroupStatus = "active" | "inactive";

export type MaterialGroup = {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
  status: MaterialGroupStatus;
};

export type MaterialGroupInput = Pick<MaterialGroup, "code" | "name" | "displayOrder">;
