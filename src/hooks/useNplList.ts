import { useQuery } from "@tanstack/react-query";
import { nplApi } from "@/api/npl.api";

export const nplKeys = {
  all: ["npl"] as const,
  lists: () => [...nplKeys.all, "list"] as const,
};

/**
 * Fetch the full NPL list.
 * Client-side filtering is applied in the page component.
 */
export function useNplList() {
  return useQuery({
    queryKey: nplKeys.lists(),
    queryFn: () => nplApi.getNplList(),
  });
}
