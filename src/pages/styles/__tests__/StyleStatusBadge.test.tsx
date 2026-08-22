import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StyleStatusBadge } from "../StyleStatusBadge";

afterEach(() => {
  cleanup();
});

describe("StyleStatusBadge", () => {
  it("renders Vietnamese label for draft", () => {
    render(<StyleStatusBadge status="draft" />);
    expect(screen.getByText("Nháp")).toBeTruthy();
  });

  it("renders Vietnamese label for approved", () => {
    render(<StyleStatusBadge status="approved" />);
    expect(screen.getByText("Đã duyệt")).toBeTruthy();
  });

  it("renders Vietnamese label for active", () => {
    render(<StyleStatusBadge status="active" />);
    expect(screen.getByText("Hoạt động")).toBeTruthy();
  });
});
