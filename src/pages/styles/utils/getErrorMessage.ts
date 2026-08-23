import axios from "axios";

export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function isConflictError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409;
}
