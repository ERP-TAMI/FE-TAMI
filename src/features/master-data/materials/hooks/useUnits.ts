import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unit.api";

export function useActiveUnits() {
  return useQuery({
    queryKey: ["units", { status: "active" }] as const,
    queryFn: unitApi.listActive,
  });
}
