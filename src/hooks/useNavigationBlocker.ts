import { useContext, useEffect, useCallback } from "react";
import {
  useBlocker,
  UNSAFE_DataRouterContext,
  type BlockerFunction,
} from "react-router-dom";

export function useSafeBlocker(shouldBlock: BlockerFunction | boolean) {
  const dataRouterContext = useContext(UNSAFE_DataRouterContext);

  // If running in an environment without DataRouter (like unit tests with plain BrowserRouter),
  // return a mock unblocked object to prevent crashing
  const blocker = dataRouterContext
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useBlocker(shouldBlock)
    : {
        state: "unblocked" as const,
        reset: () => {},
        proceed: () => {},
        location: undefined,
      };

  return blocker;
}

export function useUnsavedChangesWarning(
  isDirty: boolean,
  message = "Bạn có dữ liệu chưa được lưu. Vui lòng bấm lưu trước khi rời khỏi trang!"
) {
  // 1. Browser unload / reload / close / external navigation
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  // 2. React Router in-app navigation blocker
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
    [isDirty]
  );

  const blocker = useSafeBlocker(shouldBlock);

  return blocker;
}
