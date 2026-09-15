import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stylesApi } from "@/api/stylesApi";
import type { CreateStylePayload, StyleQueryFilter, UpdateStylePayload } from "@/types/style";

export const styleKeys = {
  all: ["styles"] as const,
  lists: () => [...styleKeys.all, "list"] as const,
  list: (filter: StyleQueryFilter) => [...styleKeys.lists(), filter] as const,
  infiniteLists: () => [...styleKeys.all, "infinite-list"] as const,
  infiniteList: (search: string) => [...styleKeys.infiniteLists(), search] as const,
  details: () => [...styleKeys.all, "detail"] as const,
  detail: (id: string) => [...styleKeys.details(), id] as const,
};

export function useStyles(filter: StyleQueryFilter) {
  return useQuery({
    queryKey: styleKeys.list(filter),
    queryFn: () => stylesApi.getStyles(filter),
  });
}

const STYLE_SEARCH_PAGE_SIZE = 20;

/**
 * Style picker cho combobox tìm kiếm (`SearchableSelect`): tải theo trang
 * qua `search`, không fetch hết danh mục Style một lần — danh mục có thể lên
 * tới hàng trăm/ngàn dòng, fetch hết sẽ chậm và nặng máy client.
 */
export function useInfiniteStyles(search: string) {
  return useInfiniteQuery({
    queryKey: styleKeys.infiniteList(search),
    queryFn: ({ pageParam }) =>
      stylesApi.getStyles({ search: search || undefined, page: pageParam, limit: STYLE_SEARCH_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

export function useStyle(id?: string) {
  return useQuery({
    queryKey: styleKeys.detail(id ?? ""),
    queryFn: () => stylesApi.getStyleById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateStyles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: styleKeys.all });
}

export function useCreateStyle() {
  const invalidate = useInvalidateStyles();
  return useMutation({
    mutationFn: (payload: CreateStylePayload) => stylesApi.createStyle(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStyle() {
  const invalidate = useInvalidateStyles();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStylePayload }) =>
      stylesApi.updateStyle(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteStyle() {
  const invalidate = useInvalidateStyles();
  return useMutation({
    mutationFn: (id: string) => stylesApi.deleteStyle(id),
    onSuccess: invalidate,
  });
}
