import { useState } from "react";
import { GitCompare, ArrowRight } from "lucide-react";
import { useBomRevisionDiff, useBomRevisions } from "@/hooks/useBoms";
import { formatUSD, canViewBomCost } from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";
import { Modal } from "@/components/shared/Modal";

interface BomRevisionDiffModalProps {
  isOpen: boolean;
  bomId: string;
  revisionId: string;
  onClose: () => void;
}

export function BomRevisionDiffModal({
  isOpen,
  bomId,
  revisionId,
  onClose,
}: BomRevisionDiffModalProps) {
  const user = useAuthStore((state) => state.user);
  const canSeeCost = canViewBomCost(user);

  const { data: revisions } = useBomRevisions(bomId);
  const [compareWithId, setCompareWithId] = useState<string>("");

  const { data: diffData, isLoading } = useBomRevisionDiff(
    bomId,
    revisionId,
    compareWithId || undefined,
  );

  const currentRev = revisions?.find((r) => r.id === revisionId);
  const otherRevisions = revisions?.filter((r) => r.id !== revisionId) || [];

  const targetRevNo = diffData?.targetRevisionNo ?? currentRev?.revisionNo ?? "";
  const baseRevNo = diffData?.baseRevisionNo;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeOnClickOutside
      size="xl"
      title={
        <div className="flex items-center gap-3">
          <div className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex h-10 w-10 items-center justify-center rounded-xl">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              So sánh biến động định mức
            </h3>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Phiên bản {targetRevNo}{" "}
              {baseRevNo ? `so với phiên bản ${baseRevNo}` : "so với phiên bản trước"}
            </p>
          </div>
        </div>
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className="text-theme-sm cursor-pointer rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Đóng
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar compare selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="text-theme-xs flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
            <span>So sánh với phiên bản:</span>
            <select
              value={compareWithId}
              onChange={(e) => setCompareWithId(e.target.value)}
              className="text-theme-xs focus:border-brand-500 rounded-lg border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">Phiên bản nguồn gốc (Mặc định)</option>
              {otherRevisions.map((r) => (
                <option key={r.id} value={r.id}>
                  Phiên bản {r.revisionNo} ({r.status})
                </option>
              ))}
            </select>
          </div>

          {/* Counts summary if available */}
          {diffData &&
            (diffData.totalAdded !== undefined || diffData.totalChanged !== undefined) && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                {diffData.totalAdded !== undefined && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    +{diffData.totalAdded} thêm
                  </span>
                )}
                {diffData.totalRemoved !== undefined && (
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    -{diffData.totalRemoved} xóa
                  </span>
                )}
                {diffData.totalChanged !== undefined && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {diffData.totalChanged} đổi
                  </span>
                )}
                {diffData.totalUnchanged !== undefined && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {diffData.totalUnchanged} giữ nguyên
                  </span>
                )}
                {canSeeCost &&
                  diffData.costDifference !== undefined &&
                  diffData.costDifference !== null && (
                    <span
                      className={`rounded-md px-2 py-0.5 ${diffData.costDifference > 0 ? "bg-amber-50 text-amber-700" : diffData.costDifference < 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      Δ: {formatUSD(diffData.costDifference)}
                    </span>
                  )}
              </div>
            )}
        </div>

        {/* Diff Table */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-theme-sm p-8 text-center text-gray-500">
              Đang tính toán so sánh diff...
            </div>
          ) : !diffData || !diffData.items || diffData.items.length === 0 ? (
            <div className="text-theme-sm p-8 text-center text-gray-500">
              Không có sự khác biệt nào giữa hai phiên bản
            </div>
          ) : (
            <table className="text-theme-sm w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400">
                  <th className="py-2.5 pr-2 pl-3">Loại biến động</th>
                  <th className="px-3 py-2.5">Vật tư</th>
                  <th className="px-3 py-2.5 text-center">ĐVT</th>
                  <th className="px-3 py-2.5 text-right">Định mức tiêu hao</th>
                  {canSeeCost && <th className="px-3 py-2.5 text-right">Đơn giá ($)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {diffData.items.map((item, idx) => {
                  const target = item.newLine ?? item.target;
                  const source = item.oldLine ?? item.source;

                  const badgeConfig: Record<string, { label: string; class: string }> = {
                    ADDED: {
                      label: "THÊM MỚI",
                      class:
                        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
                    },
                    REMOVED: {
                      label: "ĐÃ XÓA",
                      class:
                        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
                    },
                    CHANGED: {
                      label: "THAY ĐỔI",
                      class:
                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
                    },
                    UNCHANGED: {
                      label: "KHÔNG ĐỔI",
                      class:
                        "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
                    },
                  };

                  const cfg = badgeConfig[item.diffType] || badgeConfig.UNCHANGED;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-2.5 pr-2 pl-3">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold ${cfg.class}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                        {item.materialNameSnapshot}
                        {item.materialGroupSnapshot && (
                          <span className="text-theme-xs ml-2 text-gray-400">
                            ({item.materialGroupSnapshot})
                          </span>
                        )}
                      </td>
                      <td className="text-theme-xs px-3 py-2.5 text-center text-gray-500">
                        {item.unitSnapshot}
                      </td>
                      <td className="text-theme-xs px-3 py-2.5 text-right font-mono">
                        {item.diffType === "ADDED" ? (
                          <span className="font-semibold text-emerald-600">
                            +{target?.consumption}
                          </span>
                        ) : item.diffType === "REMOVED" ? (
                          <span className="text-rose-500 line-through">{source?.consumption}</span>
                        ) : item.diffType === "CHANGED" ? (
                          <div className="flex items-center justify-end gap-1.5 font-semibold">
                            <span className="text-gray-400 line-through">
                              {source?.consumption}
                            </span>
                            <ArrowRight className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-600">{target?.consumption}</span>
                          </div>
                        ) : (
                          <span>{target?.consumption ?? source?.consumption}</span>
                        )}
                      </td>
                      {canSeeCost && (
                        <td className="text-theme-xs px-3 py-2.5 text-right font-mono">
                          {item.diffType === "CHANGED" && source?.unitCost !== target?.unitCost ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-gray-400 line-through">
                                <span>{formatUSD(source?.unitCost)}</span>
                              </span>
                              <ArrowRight className="h-3 w-3 text-amber-500" />
                              <span className="font-semibold text-amber-600">
                                <span>{formatUSD(target?.unitCost)}</span>
                              </span>
                            </div>
                          ) : (
                            <span>
                              <span>{formatUSD(target?.unitCost ?? source?.unitCost)}</span>
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
