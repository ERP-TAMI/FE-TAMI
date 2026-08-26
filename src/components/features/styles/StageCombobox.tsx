import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { stageApi } from "@/api/stage.api";
import { stageGroupApi, type StageGroup } from "@/api/stage-group.api";
import { CheckLineIcon, PlugInIcon } from "@/icons";



export interface StageComboboxOption {
  id: string;
  name: string;
  code?: string;
  description?: string;
  ssv?: number;
  isGroup?: boolean;
  group?: StageGroup;
}

let _cache: StageComboboxOption[] | null = null;

async function getStageOptions(): Promise<StageComboboxOption[]> {
  if (_cache) return _cache;
  try {
    const [stages, groups] = await Promise.all([
      stageApi.list(),
      stageGroupApi.getStageGroups(),
    ]);

    const groupOptions: StageComboboxOption[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      description: g.description,
      isGroup: true,
      group: g,
    }));

    const stageOptions: StageComboboxOption[] = stages.map((s) => ({
      id: s.id,
      name: s.stageName,
      code: s.stageCode,
      description: s.description || undefined,
      ssv: Number(s.ssv) || 0,

      isGroup: false,
    }));

    _cache = [...groupOptions, ...stageOptions];
    return _cache;
  } catch {
    return [];
  }
}

export interface StageComboboxProps {
  value?: string;
  stageId?: string | null;
  onCommit?: (stageData: {
    name: string;
    description: string;
    timePerPiece: number;
    ssv: number;
    stageId: string;
  }) => void;
  onGroupPick?: (group: StageGroup) => void;
  onNameChange?: (val: string) => void;
}

export function StageCombobox({
  value = "",
  stageId,
  onCommit,
  onGroupPick,
  onNameChange,
}: StageComboboxProps) {
  const [stages, setStages] = useState<StageComboboxOption[]>(_cache || []);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    getStageOptions().then(setStages).catch(() => {});
  }, []);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  function calcPos() {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: Math.max(r.width, 300),
    });
  }

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return stages.slice(0, 15);
    return stages.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q),
    );
  })();

  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current && listRef.current.children[activeIdx]) {
      (listRef.current.children[activeIdx] as HTMLElement).scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeIdx]);

  function openDrop() {
    calcPos();
    setOpen(true);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onNameChange?.(v);
    setOpen(true);
    calcPos();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown") openDrop();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) pick(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  function pick(stage: StageComboboxOption) {
    if (stage.isGroup && stage.group) {
      setQuery(stage.name);
      setOpen(false);
      setActiveIdx(-1);
      onGroupPick?.(stage.group);
      return;
    }

    const timePerPiece = stage.ssv ? +(Number(stage.ssv)).toFixed(1) : 0;
    setQuery(stage.name);
    setOpen(false);
    setActiveIdx(-1);
    onCommit?.({
      name: stage.name,
      description: stage.description || "",
      timePerPiece,
      ssv: Number(stage.ssv) || 0,
      stageId: stage.id,
    });
  }

  function HighlightedText({ text }: { text: string }) {
    const q = query.trim();
    if (!q) return <>{text}</>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-yellow-100 dark:bg-yellow-900/60 dark:text-yellow-200 text-yellow-900 not-italic rounded px-0.5">
          {text.slice(i, i + q.length)}
        </mark>
        {text.slice(i + q.length)}
      </>
    );
  }

  const dropdown =
    open &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[99998]"
          onMouseDown={() => setOpen(false)}
        />
        <div
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 99999,
          }}
          className="rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden dark:border-gray-800 dark:bg-gray-900"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400 text-center">
              {query.trim() ? "Không tìm thấy công đoạn phù hợp" : "Không có dữ liệu"}
            </p>
          ) : (
            <ul
              ref={listRef}
              className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800"
            >
              {filtered.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${
                    i === activeIdx
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  } ${s.id === stageId ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                >
                  {s.isGroup ? (
                    <span className="mt-0.5 shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                      NHÓM
                    </span>
                  ) : (
                    <span className="mt-0.5 shrink-0 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {s.code}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate ${
                        s.isGroup
                          ? "text-purple-900 dark:text-purple-300"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      <HighlightedText text={s.name} />
                    </p>
                    {s.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {s.description}
                      </p>
                    )}
                  </div>
                  {!s.isGroup && (
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {Number(s.ssv).toFixed(3)}
                      </p>
                      <p className="text-[10px] text-gray-400">SSV</p>
                    </div>
                  )}
                  {s.id === stageId && !s.isGroup && (
                    <CheckLineIcon className="w-3.5 h-3.5 mt-1 text-blue-500 shrink-0" />
                  )}

                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-4 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
            <span>↑↓ di chuyển</span>
            <span>↵ chọn</span>
            <span>Esc đóng</span>
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`flex items-center rounded-md transition-all ${
          open
            ? "ring-1 ring-blue-400 bg-white dark:bg-gray-900 shadow-xs"
            : "hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
        }`}
      >
        {stageId && <PlugInIcon className="ml-2 w-3 h-3 shrink-0 text-blue-400" />}

        <input
          type="text"
          value={query}
          onFocus={openDrop}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          placeholder="Tên công đoạn..."
          className={`h-9 flex-1 min-w-0 bg-transparent text-sm font-medium px-2 placeholder:text-gray-400 focus:outline-none ${
            stageId
              ? "text-blue-800 dark:text-blue-300"
              : "text-gray-900 dark:text-white"
          }`}
        />
      </div>
      {dropdown}
    </div>
  );
}
