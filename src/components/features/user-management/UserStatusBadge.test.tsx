import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UserStatusBadge } from "./UserStatusBadge";

describe("UserStatusBadge", () => {
  afterEach(cleanup);

  it.each([
    ["active", "Đang hoạt động"],
    ["locked", "Bị khóa"],
    ["inactive", "Vô hiệu hóa"],
  ] as const)("renders the %s status label", (status, label) => {
    render(<UserStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});
