export const WORKSHOP_CAPACITY_MAX = 2_147_483_647;

export type WorkshopStatus = "active" | "inactive";

export type Workshop = {
  id: string;
  workshopCode: string;
  name: string;
  manager: string | null;
  location: string | null;
  capacity: number;
  status: WorkshopStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkshopQuery = {
  search?: string;
  status?: WorkshopStatus;
  page?: number;
  limit?: number;
};

export type WorkshopListResponse = {
  data: Workshop[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateWorkshopInput = Pick<
  Workshop,
  "workshopCode" | "name" | "manager" | "location" | "capacity"
>;

export type UpdateWorkshopInput = Partial<
  Pick<Workshop, "workshopCode" | "name" | "manager" | "location" | "capacity">
>;
