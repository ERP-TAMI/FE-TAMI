export type SizeChartStatus = "active" | "inactive";

export type SizeChart = {
  id: string;
  name: string;
  sizes: string[];
  status: SizeChartStatus;
  createdAt: string;
  updatedAt: string;
};

export type SizeChartQuery = {
  search?: string;
  status?: SizeChartStatus;
};

export type CreateSizeChartInput = Pick<SizeChart, "name" | "sizes">;
export type UpdateSizeChartInput = Partial<CreateSizeChartInput>;
