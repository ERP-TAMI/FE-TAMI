import { Activity, ShieldCheck, UserRound } from "lucide-react";
import type { KeyboardEvent } from "react";

export type ProfileTabId = "personal" | "security" | "activity";

const TABS = [
  { id: "personal", label: "Thông tin cá nhân", Icon: UserRound },
  { id: "security", label: "Bảo mật", Icon: ShieldCheck },
  { id: "activity", label: "Hoạt động", Icon: Activity },
] as const satisfies ReadonlyArray<{
  id: ProfileTabId;
  label: string;
  Icon: typeof UserRound;
}>;

type ProfileTabNavigationProps = {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
};

export function ProfileTabNavigation({ activeTab, onTabChange }: ProfileTabNavigationProps) {
  const focusTab = (tab: ProfileTabId) => {
    onTabChange(tab);
    document.getElementById(`profile-tab-${tab}`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: ProfileTabId) => {
    const currentIndex = TABS.findIndex((item) => item.id === tab);
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % TABS.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;

    if (nextIndex !== undefined) {
      event.preventDefault();
      focusTab(TABS[nextIndex].id);
    }
  };

  return (
    <div className="overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-800">
      <div role="tablist" aria-label="Tài khoản" className="flex w-max min-w-full px-5 sm:px-7">
        {TABS.map(({ id, label, Icon }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              id={`profile-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="profile-tabpanel"
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(id)}
              onKeyDown={(event) => handleKeyDown(event, id)}
              className={`-mb-px inline-flex min-h-14 shrink-0 cursor-pointer items-center gap-2.5 border-b-2 px-4 text-base font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500 ${
                selected
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
