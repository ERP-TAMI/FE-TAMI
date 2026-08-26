import { useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/shared";
import { CloseIcon } from "@/icons";
import { findDuplicateSize, parseSizeLabels } from "./sizeChartForm.utils";

type SizeChipInputProps = {
  id: string;
  labels: string[];
  draft: string;
  error?: string;
  disabled?: boolean;
  onLabelsChange: (labels: string[]) => void;
  onDraftChange: (draft: string) => void;
};

export function SizeChipInput({
  id,
  labels,
  draft,
  error,
  disabled = false,
  onLabelsChange,
  onDraftChange,
}: SizeChipInputProps) {
  const [inputError, setInputError] = useState<string>();
  const visibleError = inputError ?? error;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const addDraft = (value = draft) => {
    const candidates = parseSizeLabels(value);
    if (candidates.length === 0) return;

    const tooLong = candidates.find((label) => label.length > 30);
    if (tooLong) {
      setInputError(`Size "${tooLong}" không được vượt quá 30 ký tự`);
      return;
    }

    const duplicate = findDuplicateSize([...labels, ...candidates]);
    if (duplicate) {
      setInputError(`Size "${duplicate}" đã tồn tại`);
      return;
    }

    onLabelsChange([...labels, ...candidates]);
    onDraftChange("");
    setInputError(undefined);
  };

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onDraftChange(value);
    setInputError(undefined);
    if (value.includes(",") || value.includes("\n")) addDraft(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    addDraft();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted.includes(",") && !pasted.includes("\n")) return;

    event.preventDefault();
    const selectionStart = event.currentTarget.selectionStart ?? draft.length;
    const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart;
    const nextValue = `${draft.slice(0, selectionStart)}${pasted}${draft.slice(selectionEnd)}`;
    onDraftChange(nextValue);
    addDraft(nextValue);
  };

  const removeLabel = (indexToRemove: number) => {
    onLabelsChange(labels.filter((_, index) => index !== indexToRemove));
    setInputError(undefined);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-theme-sm block font-medium text-gray-700 dark:text-gray-300"
      >
        Danh sách Size
      </label>
      <div
        className={`rounded-lg border p-3 transition focus-within:ring-3 ${
          visibleError
            ? "border-error-500 focus-within:border-error-500 focus-within:ring-error-500/10"
            : "focus-within:border-brand-500 focus-within:ring-brand-500/10 border-gray-200 dark:border-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="text"
            value={draft}
            disabled={disabled}
            placeholder="Nhập một Size, ví dụ: M"
            autoComplete="off"
            aria-label="Nhập Size"
            aria-invalid={Boolean(visibleError)}
            aria-describedby={visibleError ? errorId : hintId}
            className="text-theme-sm h-9 min-w-0 flex-1 bg-transparent px-1 text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => addDraft()}
          >
            Thêm
          </Button>
        </div>

        {labels.length > 0 && (
          <ul
            className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800"
            aria-label="Danh sách Size đã thêm"
          >
            {labels.map((label, index) => (
              <li
                key={`${label}-${index}`}
                className="bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 inline-flex min-h-8 max-w-full items-center gap-1 rounded-md px-2.5 py-1 font-medium"
              >
                <span className="text-theme-xs truncate">{label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Xóa Size ${label}`}
                  className="hover:bg-brand-100 focus:ring-brand-500/30 dark:hover:bg-brand-500/20 -mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => removeLabel(index)}
                >
                  <CloseIcon className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {visibleError ? (
        <p id={errorId} className="text-theme-xs text-error-500" role="alert">
          {visibleError}
        </p>
      ) : (
        <div
          id={hintId}
          className="text-theme-xs flex flex-wrap justify-between gap-1 text-gray-500 dark:text-gray-400"
        >
          <span>Nhấn Enter hoặc dấu phẩy để thêm. Có thể dán nhiều Size cùng lúc.</span>
          <span aria-live="polite">{labels.length} Size đã thêm</span>
        </div>
      )}
    </div>
  );
}
