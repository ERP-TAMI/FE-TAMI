import { Check, AlertTriangle } from "lucide-react";
import type { BomStatus } from "@/types/bom";

interface BomWorkflowStepperProps {
  status: string;
  discontinuedAt?: string | Date | null;
}

interface StepInfo {
  key: BomStatus | "closed";
  num: number;
  label: string;
  role: string;
}

const STEPS: StepInfo[] = [
  {
    key: "wait_nvkh",
    num: 1,
    label: "Khởi tạo",
    role: "NVKH",
  },
  {
    key: "wait_rd",
    num: 2,
    label: "Định mức",
    role: "R&D",
  },
  {
    key: "wait_tpkh_confirm",
    num: 3,
    label: "Xác nhận",
    role: "TPKH",
  },
  {
    key: "wait_accounting",
    num: 4,
    label: "Tính giá",
    role: "Kế toán",
  },
  {
    key: "wait_sa_approve",
    num: 5,
    label: "Phê duyệt",
    role: "Ban GĐ",
  },
];

export function BomWorkflowStepper({
  status,
  discontinuedAt,
}: BomWorkflowStepperProps) {
  const isDiscontinued = status === "discontinued" || !!discontinuedAt;
  const isClosed = status === "closed";

  const getStepIndex = (st: string): number => {
    switch (st) {
      case "wait_nvkh":
        return 0;
      case "wait_rd":
        return 1;
      case "wait_tpkh_confirm":
        return 2;
      case "wait_accounting":
        return 3;
      case "wait_sa_approve":
        return 4;
      case "closed":
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  if (isDiscontinued) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-theme-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
        <div>
          <span className="font-bold">BOM đã ngừng sử dụng (Discontinued): </span>
          <span className="text-rose-700 dark:text-rose-400">
            Phiên bản này đã bị dừng và bị khóa toàn bộ các thao tác chỉnh sửa.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="relative">
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((step, idx) => {
            const isCompleted = isClosed || idx < currentIndex;
            const isCurrent = !isClosed && idx === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                {/* Connector Line + Circle Indicator */}
                <div className="relative flex w-full items-center justify-center">
                  {/* Left Connector Line */}
                  {idx > 0 && (
                    <div
                      className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${
                        idx <= currentIndex || isClosed
                          ? "bg-brand-500 dark:bg-brand-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                  {/* Right Connector Line */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${
                        idx < currentIndex || isClosed
                          ? "bg-brand-500 dark:bg-brand-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}

                  {/* Circle */}
                  <div
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                        : isCompleted
                        ? "bg-brand-500 text-white dark:bg-brand-600"
                        : "border border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <span>{step.num}</span>
                    )}
                  </div>
                </div>

                {/* Step Labels */}
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={`text-theme-xs font-medium ${
                      isCurrent
                        ? "font-bold text-gray-900 dark:text-white"
                        : isCompleted
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
