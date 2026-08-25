import { ArrowDownIcon, ArrowUpIcon, CheckLineIcon, PencilIcon, TrashBinIcon } from "@/icons";

type StageGroupItemActionsProps = {
  stageName: string;
  position: number;
  itemCount: number;
  isEditing: boolean;
  hasSsvError: boolean;
  editDisabled: boolean;
  moveDisabled: boolean;
  removeDisabled: boolean;
  onToggleEdit: () => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

const actionClass =
  "rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

export function StageGroupItemActions({
  stageName,
  position,
  itemCount,
  isEditing,
  hasSsvError,
  editDisabled,
  moveDisabled,
  removeDisabled,
  onToggleEdit,
  onMove,
  onRemove,
}: StageGroupItemActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label={
          isEditing ? `Hoàn tất sửa công đoạn ${stageName}` : `Sửa công đoạn ${stageName}`
        }
        title={isEditing ? "Hoàn tất sửa" : "Sửa công đoạn và SSV"}
        disabled={editDisabled || (isEditing && hasSsvError)}
        onClick={onToggleEdit}
        className={actionClass}
      >
        {isEditing ? (
          <CheckLineIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PencilIcon className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        aria-label={`Đưa ${stageName} lên`}
        title="Đưa lên"
        disabled={moveDisabled || position === 0}
        onClick={() => onMove(position, position - 1)}
        className={actionClass}
      >
        <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Đưa ${stageName} xuống`}
        title="Đưa xuống"
        disabled={moveDisabled || position === itemCount - 1}
        onClick={() => onMove(position, position + 1)}
        className={actionClass}
      >
        <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Xóa ${stageName} khỏi nhóm`}
        title="Xóa khỏi nhóm"
        disabled={removeDisabled}
        onClick={() => onRemove(position)}
        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
      >
        <TrashBinIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
