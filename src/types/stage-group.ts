export type StageGroupStatus = "active" | "inactive";

export type StageGroupItem = {
  id: string;
  itemName: string;
  description: string | null;
  ssv: string;
  status: StageGroupStatus;
  orderIndex: number;
};

export type StageGroupSummary = {
  id: string;
  groupCode: string;
  groupName: string;
  description: string | null;
  status: StageGroupStatus;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StageGroup = StageGroupSummary & {
  items: StageGroupItem[];
};

export type StageGroupItemInput = Omit<StageGroupItem, "id"> & { id?: string };

export type StageGroupInput = Pick<StageGroup, "groupName" | "description"> & {
  groupCode?: string;
  items: StageGroupItemInput[];
};

export type StageGroupUpdateInput = Partial<StageGroupInput>;
export type StageGroupListParams = { search?: string; status?: StageGroupStatus };
