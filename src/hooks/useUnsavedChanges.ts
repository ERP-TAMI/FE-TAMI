import { useEffect } from "react";

export function useUnsavedChanges(isDirty: boolean, message = "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?") {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, message]);
}
