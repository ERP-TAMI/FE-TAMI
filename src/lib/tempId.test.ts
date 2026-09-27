import { describe, it, expect } from "vitest";
import { isUuid, createTempIdResolver } from "./tempId";

describe("isUuid", () => {
  it("accepts a well-formed UUID", () => {
    expect(isUuid("11111111-aaaa-4aaa-8aaa-111111111111")).toBe(true);
  });

  it("rejects client-only temp ids and empty values", () => {
    expect(isUuid("new-1699999999999")).toBe(false);
    expect(isUuid("child-1699999999999-ab12c")).toBe(false);
    expect(isUuid("group-1699999999999")).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

describe("createTempIdResolver", () => {
  it("returns an already-valid UUID unchanged", () => {
    const resolveId = createTempIdResolver();
    const realId = "11111111-aaaa-4aaa-8aaa-111111111111";
    expect(resolveId(realId)).toBe(realId);
  });

  it("returns undefined for a nullish id", () => {
    const resolveId = createTempIdResolver();
    expect(resolveId(undefined)).toBeUndefined();
    expect(resolveId(null)).toBeUndefined();
  });

  it("maps a client-only temp id to a real UUID", () => {
    const resolveId = createTempIdResolver();
    const resolved = resolveId("new-1699999999999");
    expect(resolved).toBeDefined();
    expect(isUuid(resolved)).toBe(true);
  });

  it("maps the same temp id to the same real UUID within one resolver instance", () => {
    const resolveId = createTempIdResolver();
    const first = resolveId("group-1699999999999");
    const second = resolveId("group-1699999999999");
    expect(first).toBe(second);
  });

  it("preserves a parent/child link: a child's parentStepId resolves to the same id as its parent's own id", () => {
    const resolveId = createTempIdResolver();
    const parentTempId = "group-1699999999999";

    // Simulates mapping an array of steps where the group (parent) row is
    // processed first, then its child row referencing the same temp id.
    const resolvedParentId = resolveId(parentTempId);
    const resolvedChildParentStepId = resolveId(parentTempId);

    expect(resolvedChildParentStepId).toBe(resolvedParentId);
  });

  it("still links correctly even if the child is resolved before its parent", () => {
    const resolveId = createTempIdResolver();
    const parentTempId = "group-1699999999999";

    const resolvedChildParentStepId = resolveId(parentTempId);
    const resolvedParentId = resolveId(parentTempId);

    expect(resolvedChildParentStepId).toBe(resolvedParentId);
  });

  it("maps different temp ids to different real UUIDs", () => {
    const resolveId = createTempIdResolver();
    const a = resolveId("new-1");
    const b = resolveId("new-2");
    expect(a).not.toBe(b);
  });
});
