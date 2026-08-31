import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { stageApi } from "@/api/stage.api";
import { stageGroupApi, type StageGroup, type StageGroupSubItem } from "@/api/stage-group.api";
import { CheckLineIcon, ChevronDownIcon, CloseLineIcon } from "@/icons";

export interface StageComboboxOption {
  id: string;
  name: string;
  code?: string;
  description?: string;
  ssv?: number;
  isGroup?: boolean;
  group?: StageGroup;
  groupName: string;
}

let _cache: StageComboboxOption[] | null = null;
let _rawGroups: StageGroup[] | null = null;

async function getStageOptions(): Promise<{ options: StageComboboxOption[]; groups: StageGroup[] }> {
  if (_cache && _rawGroups) return { options: _cache, groups: _rawGroups };
  try {
    const [stages, groups] = await Promise.all([
      stageApi.list(),
      stageGroupApi.getStageGroups(),
    ]);

    _rawGroups = groups;
    const result: StageComboboxOption[] = [];
    const addedNames = new Set<string>();

    for (const g of groups) {
      const groupTitle = (g.name || "Nhóm công đoạn").toUpperCase();

      if (g.items && g.items.length > 0) {
        result.push({
          id: `group-${g.id}`,
          name: `${g.name} (Tất cả công đoạn)`,
          code: g.code,
          description: g.description,
          isGroup: true,
          group: g,
          groupName: groupTitle,
        });

        for (const it of g.items) {
          addedNames.add(it.name.toLowerCase().trim());
          result.push({
            id: it.id || `item-${g.id}-${it.orderIndex}`,
            name: it.name,
            description: it.description,
            ssv: Number(it.ssv) || 0,
            isGroup: false,
            groupName: groupTitle,
          });
        }
      } else {
        result.push({
          id: g.id,
          name: g.name,
          code: g.code,
          description: g.description,
          isGroup: true,
          group: g,
          groupName: "NHÓM CÔNG ĐOẠN",
        });
      }
    }

    for (const s of stages) {
      const lowerName = s.stageName.toLowerCase().trim();
      if (!addedNames.has(lowerName)) {
        addedNames.add(lowerName);
        result.push({
          id: s.id,
          name: s.stageName,
          code: s.stageCode,
          description: s.description || undefined,
          ssv: Number(s.ssv) || 0,
          isGroup: false,
          groupName: "CÔNG ĐOẠN KHÁC",
        });
      }
    }

    _cache = result;
    return { options: _cache, groups: _rawGroups };
  } catch {
    return { options: [], groups: [] };
  }
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-100/80 dark:bg-brand-900/60 dark:text-brand-200 text-brand-900 not-italic rounded px-0.5 font-semibold">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export interface StageComboboxProps {
  value?: string;
  stageId?: string | null;
  allowGroupSelection?: boolean;
  groupItems?: StageGroupSubItem[];
  parentGroupName?: string;
  parentGroupId?: string;
  onCommit?: (stageData: {
    name: string;
    description: string;
    timePerPiece: number;
    ssv: number;
    stageId: string;
  }) => void;
  onClear?: () => void;
  onGroupPick?: (group: StageGroup) => void;
  onNameChange?: (val: string) => void;
}

export function StageCombobox({
  value = "",
  stageId,
  allowGroupSelection = true,
  groupItems,
  parentGroupName,
  parentGroupId,
  onCommit,
  onClear,
  onGroupPick,
  onNameChange,
}: StageComboboxProps) {
  const [stages, setStages] = useState<StageComboboxOption[]>(_cache || []);
  const [rawGroups, setRawGroups] = useState<StageGroup[]>(_rawGroups || []);
  const [query, setQuery] = useState(value);
  const [selectedId, setSelectedId] = useState<string | null>(stageId ?? null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320, maxHeight: 260 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStageOptions().then(({ options, groups }) => {
      setStages(options);
      setRawGroups(groups);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    setSelectedId(stageId ?? null);
  }, [stageId]);

  function calcPos() {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const dropdownMaxHeight = 260;
    const spaceBelow = window.innerHeight - r.bottom;
    const showAbove = spaceBelow < dropdownMaxHeight && r.top > dropdownMaxHeight;

    const width = Math.max(r.width, 320);
    let left = r.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    setPos({
      top: showAbove ? r.top - dropdownMaxHeight - 6 : r.bottom + 6,
      left,
      width,
      maxHeight: showAbove ? Math.min(dropdownMaxHeight, r.top - 12) : Math.min(dropdownMaxHeight, spaceBelow - 12),
    });
  }

  useEffect(() => {
    if (!open) return;
    calcPos();

    function handleScrollOrResize() {
      calcPos();
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const filteredOptions = (() => {
    const q = query.trim().toLowerCase();

    // Nếu row này là con của một nhóm công đoạn → chỉ hiển thị danh sách công đoạn con của nhóm đó
    const isChildOfGroup = !!(parentGroupName || parentGroupId || (groupItems && groupItems.length > 0));

    if (isChildOfGroup) {
      // Ưu tiên groupItems được truyền trực tiếp từ row nhóm cha
      let subItems: { id?: string; name: string; description?: string; ssv?: number }[] = [];

      if (groupItems && groupItems.length > 0) {
        subItems = groupItems;
      } else if (rawGroups.length > 0) {
        // Fallback 1: tìm trong rawGroups theo groupId của nhóm cha (nếu có)
        if (parentGroupId) {
          const matchedById = rawGroups.find((g) => g.id === parentGroupId);
          if (matchedById?.items && matchedById.items.length > 0) {
            subItems = matchedById.items;
          }
        }
        // Fallback 2: tìm theo tên nhóm cha nếu không tìm thấy theo ID
        if (subItems.length === 0 && parentGroupName) {
          const pName = parentGroupName.toLowerCase().trim();
          const matchedByName = rawGroups.find(
            (g) => (g.name || "").toLowerCase().trim() === pName
          );
          if (matchedByName?.items && matchedByName.items.length > 0) {
            subItems = matchedByName.items;
          }
        }
      }

      const groupTitle = (parentGroupName || "CÔNG ĐOẠN TRONG NHÓM").toUpperCase();

      const scopedList: StageComboboxOption[] = subItems.map((it, i) => ({
        id: `sub-item-${it.id || i}`,
        name: it.name,
        description: it.description,
        ssv: Number(it.ssv) || 0,
        isGroup: false,
        groupName: groupTitle,
      }));

      if (!q) return scopedList;
      return scopedList.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q)
      );
    }

    // Row độc lập (không thuộc nhóm): hiển thị toàn bộ danh mục công đoạn
    let list = stages;
    if (!allowGroupSelection || !onGroupPick) {
      list = list.filter((s) => !s.isGroup);
    }
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q) ||
        s.groupName.toLowerCase().includes(q)
    );
  })();

  const groupedOptions = (() => {
    const map = new Map<string, StageComboboxOption[]>();
    for (const item of filteredOptions) {
      const gName = item.groupName || "CÔNG ĐOẠN KHÁC";
      if (!map.has(gName)) map.set(gName, []);
      map.get(gName)!.push(item);
    }
    return map;
  })();

  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-option-index="${activeIdx}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
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
    if (!v) {
      setSelectedId(null);
      onClear?.();
    }
    setOpen(true);
    calcPos();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setQuery("");
    setSelectedId(null);
    onNameChange?.("");
    onClear?.();
    inputRef.current?.focus();
    openDrop();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") openDrop();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filteredOptions[activeIdx]) pick(filteredOptions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  function pick(stage: StageComboboxOption) {
    if (stage.isGroup && stage.group) {
      setQuery(stage.name);
      setSelectedId(null);
      setOpen(false);
      setActiveIdx(-1);
      onGroupPick?.(stage.group);
      return;
    }

    const timePerPiece = stage.ssv ? +(Number(stage.ssv)).toFixed(1) : 0;
    setQuery(stage.name);
    setSelectedId(stage.id);
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
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
            zIndex: 99999,
          }}
          className="rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col font-outfit"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
              {(parentGroupName || parentGroupId || (groupItems && groupItems.length > 0)) ? (
                query.trim() ? (
                  <span>Không tìm thấy công đoạn khớp trong nhóm <b className="text-gray-500 dark:text-gray-300">{parentGroupName}</b></span>
                ) : (
                  <span>Nhóm <b className="text-gray-500 dark:text-gray-300">{parentGroupName}</b> chưa có danh sách công đoạn mẫu. Bạn có thể tự nhập tên vào ô trên.</span>
                )
              ) : (
                "Không tìm thấy công đoạn phù hợp"
              )}
            </div>
          ) : (
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto divide-y divide-gray-100/60 dark:divide-gray-800/60"
            >
              {Array.from(groupedOptions.entries()).map(([gName, items]) => (
                <div key={gName} className="pb-1">
                  <div className="px-4 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-900 z-20 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shadow-2xs">
                    <span>{gName}</span>
                    {query.trim() && (
                      <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">
                        {items.length} kết quả
                      </span>
                    )}
                  </div>
                  <ul className="px-1 pt-1">
                    {items.map((s) => {
                      const globalIdx = filteredOptions.indexOf(s);
                      const isSelected = Boolean(selectedId && s.id === selectedId);
                      const isActive = globalIdx === activeIdx;

                      return (
                        <li
                          key={s.id}
                          data-option-index={globalIdx}
                          className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer select-none rounded-xl transition-all duration-150 my-0.5 ${
                            isActive
                              ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold ring-1 ring-brand-200 dark:ring-brand-900"
                              : isSelected
                              ? "bg-brand-50/80 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                          }`}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pick(s)}
                        >
                          <span className="truncate pr-2">
                            <HighlightedText text={s.name} query={query} />
                          </span>
                          {isSelected && (
                            <CheckLineIcon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 ml-2" />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50/60 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 text-[10px] font-medium text-gray-400 shrink-0">
            <span className="flex gap-4">
              <span>↑↓ di chuyển</span>
              <span>↵ chọn</span>
              <span>Esc đóng</span>
            </span>
          </div>
        </div>
      </>,
      document.body
    );

  return (
    <div ref={wrapRef} className="relative w-full font-outfit">
      <div
        className={`flex items-center rounded-2xl border bg-white dark:bg-gray-900 transition-all duration-200 ${
          open
            ? "border-brand-500 ring-4 ring-brand-500/10 shadow-xs"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
        }`}
      >
        <SearchIcon className="ml-3 w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={openDrop}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          placeholder="Tìm công đoạn..."
          className="h-10 flex-1 min-w-0 bg-transparent text-sm text-gray-900 dark:text-white font-medium px-3 placeholder:text-gray-400 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
            title="Xóa lựa chọn"
          >
            <CloseLineIcon className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => (open ? setOpen(false) : openDrop())}
          className="p-1.5 mr-2 text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? "rotate-180 text-brand-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>
      {dropdown}
    </div>
  );
}


