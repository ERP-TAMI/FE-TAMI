export type MaterialGroupStatus = "active" | "inactive";

export type MaterialGroup = {
  id: string;
  code: string;
  name: string;
  status: MaterialGroupStatus;
};

export type MaterialGroupInput = Pick<MaterialGroup, "name">;
