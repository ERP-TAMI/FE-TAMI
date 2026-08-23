export type StageStatus = "active" | "inactive";

export type Stage = {
  id: string;
  stageCode: string;
  stageName: string;
  description: string | null;
  ssv: string;
  status: StageStatus;
};

export type StageInput = Pick<Stage, "stageName" | "description" | "ssv"> & {
  stageCode?: string;
};
export type StageUpdateInput = Partial<Omit<StageInput, "stageCode">>;
export type StageListParams = { search?: string; status?: StageStatus };
export type StageSsvBulkInput = { items: Array<Pick<Stage, "id" | "ssv">> };

export const STAGE_SSV_PATTERN = /^\d{1,9}(?:\.\d{1,3})?$/;
