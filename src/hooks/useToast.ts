import { useState } from "react";

type ToastVariant = "success" | "error";

type ToastState = {
  message: string;
  variant: ToastVariant;
};

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, variant: ToastVariant = "success") => {
    setToast({ message, variant });
  };

  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}
