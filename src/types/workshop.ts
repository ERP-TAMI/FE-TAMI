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
};

export type CreateWorkshopInput = Pick<
  Workshop,
  "workshopCode" | "name" | "manager" | "location" | "capacity"
>;

export type UpdateWorkshopInput = Partial<
  Pick<Workshop, "name" | "manager" | "location" | "capacity">
>;
