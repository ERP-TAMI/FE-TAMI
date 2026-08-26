import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workshopApi } from "@/api/workshop.api";
import { workshopKeys } from "@/api/workshop.keys";
import type {
  CreateWorkshopInput,
  UpdateWorkshopInput,
  WorkshopQuery,
  WorkshopStatus,
} from "@/types/workshop";

export function useWorkshops(query: WorkshopQuery = {}) {
  return useQuery({
    queryKey: workshopKeys.list(query),
    queryFn: () => workshopApi.list(query),
  });
}

export function useWorkshop(id: string) {
  return useQuery({
    queryKey: workshopKeys.detail(id),
    queryFn: () => workshopApi.detail(id),
    enabled: Boolean(id),
  });
}

function useInvalidateWorkshops() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: workshopKeys.all });
}

export function useCreateWorkshop() {
  const invalidate = useInvalidateWorkshops();
  return useMutation({ mutationFn: workshopApi.create, onSuccess: invalidate });
}

export function useUpdateWorkshop() {
  const invalidate = useInvalidateWorkshops();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkshopInput }) =>
      workshopApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateWorkshopStatus() {
  const invalidate = useInvalidateWorkshops();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkshopStatus }) =>
      workshopApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkshop() {
  const invalidate = useInvalidateWorkshops();
  return useMutation({
    mutationFn: (id: string) => workshopApi.delete(id),
    onSuccess: invalidate,
  });
}

export type { CreateWorkshopInput };
