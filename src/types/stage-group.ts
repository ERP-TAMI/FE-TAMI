export type StageGroupStatus = "active" | "inactive";

export type StageGroupItem = {
  stageId: string;
  stageCode: string;
  stageName: string;
  description: string | null;
  ssv: string;
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

export type StageGroupItemInput = Pick<StageGroupItem, "stageId" | "ssv" | "orderIndex">;

export type StageGroupInput = Pick<StageGroup, "groupName" | "description"> & {
  groupCode?: string;
  items: StageGroupItemInput[];
};

export type StageGroupUpdateInput = Partial<Omit<StageGroupInput, "groupCode">>;
export type StageGroupListParams = { search?: string; status?: StageGroupStatus };
