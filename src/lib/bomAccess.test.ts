import { describe, it, expect } from "vitest";
import {
  canForwardBom,
  canRejectBom,
  canApproveBom,
  canEditTechnicalLines,
  canEditUnitCost,
  canEditDeadline,
  canEditRdNote,
  canDiscontinueBom,
  canCreateRevision,
  canCopyFitBom,
  getAvailableRejectTargets,
  formatUSD,
  formatVND,
  formatDate,
} from "./bomAccess";

describe("bomAccess - Permission Matrix & Workflow Guards", () => {
  const roles = {
    nvkh: { roleCode: "nvkh" },
    rd: { roleCode: "rd" },
    tpkh: { roleCode: "tpkh" },
    kt: { roleCode: "kt" },
    accounting: { roleCode: "accounting" },
    sa: { roleCode: "sa" },
    admin: { roleCode: "admin" },
    viewer: { roleCode: "viewer" },
  };

  describe("canForwardBom - Strict State-Role Matrix", () => {
    it("at wait_nvkh (N1): ONLY nvkh can forward, tpkh/sa/admin cannot forward", () => {
      expect(canForwardBom(roles.nvkh, "wait_nvkh")).toBe(true);
      expect(canForwardBom(roles.rd, "wait_nvkh")).toBe(false);
      expect(canForwardBom(roles.tpkh, "wait_nvkh")).toBe(false);
      expect(canForwardBom(roles.kt, "wait_nvkh")).toBe(false);
      expect(canForwardBom(roles.sa, "wait_nvkh")).toBe(false);
      expect(canForwardBom(roles.admin, "wait_nvkh")).toBe(false);
    });

    it("at wait_rd (N2): ONLY rd can forward, nvkh/tpkh/sa/admin cannot forward", () => {
      expect(canForwardBom(roles.rd, "wait_rd")).toBe(true);
      expect(canForwardBom(roles.nvkh, "wait_rd")).toBe(false);
      expect(canForwardBom(roles.tpkh, "wait_rd")).toBe(false);
      expect(canForwardBom(roles.kt, "wait_rd")).toBe(false);
      expect(canForwardBom(roles.sa, "wait_rd")).toBe(false);
      expect(canForwardBom(roles.admin, "wait_rd")).toBe(false);
    });

    it("at wait_tpkh_confirm (N3): ONLY tpkh can forward", () => {
      expect(canForwardBom(roles.tpkh, "wait_tpkh_confirm")).toBe(true);
      expect(canForwardBom(roles.nvkh, "wait_tpkh_confirm")).toBe(false);
      expect(canForwardBom(roles.rd, "wait_tpkh_confirm")).toBe(false);
      expect(canForwardBom(roles.kt, "wait_tpkh_confirm")).toBe(false);
      expect(canForwardBom(roles.sa, "wait_tpkh_confirm")).toBe(false);
      expect(canForwardBom(roles.admin, "wait_tpkh_confirm")).toBe(false);
    });

    it("at wait_accounting (N4): ONLY accounting can forward", () => {
      expect(canForwardBom(roles.kt, "wait_accounting")).toBe(false);
      expect(canForwardBom(roles.accounting, "wait_accounting")).toBe(true);
      expect(canForwardBom(roles.nvkh, "wait_accounting")).toBe(false);
      expect(canForwardBom(roles.rd, "wait_accounting")).toBe(false);
      expect(canForwardBom(roles.tpkh, "wait_accounting")).toBe(false);
      expect(canForwardBom(roles.sa, "wait_accounting")).toBe(false);
      expect(canForwardBom(roles.admin, "wait_accounting")).toBe(false);
    });

    it("at wait_sa_approve (N5): forward is forbidden for all roles (must use approve)", () => {
      expect(canForwardBom(roles.sa, "wait_sa_approve")).toBe(false);
      expect(canForwardBom(roles.admin, "wait_sa_approve")).toBe(false);
      expect(canForwardBom(roles.tpkh, "wait_sa_approve")).toBe(false);
      expect(canForwardBom(roles.kt, "wait_sa_approve")).toBe(false);
    });

    it("closed and discontinued revisions can never be forwarded", () => {
      expect(canForwardBom(roles.sa, "closed")).toBe(false);
      expect(canForwardBom(roles.nvkh, "closed")).toBe(false);
      expect(canForwardBom(roles.sa, "discontinued")).toBe(false);
      expect(canForwardBom(roles.nvkh, "wait_nvkh", true)).toBe(false);
    });
  });

  describe("canRejectBom - Strict State-Role Matrix", () => {
    it("at wait_nvkh (N1): cannot reject (initial state)", () => {
      expect(canRejectBom(roles.nvkh, "wait_nvkh")).toBe(false);
      expect(canRejectBom(roles.tpkh, "wait_nvkh")).toBe(false);
      expect(canRejectBom(roles.sa, "wait_nvkh")).toBe(false);
    });

    it("at wait_rd (N2): ONLY rd can reject (tpkh/sa cannot)", () => {
      expect(canRejectBom(roles.rd, "wait_rd")).toBe(true);
      expect(canRejectBom(roles.nvkh, "wait_rd")).toBe(false);
      expect(canRejectBom(roles.tpkh, "wait_rd")).toBe(false);
      expect(canRejectBom(roles.sa, "wait_rd")).toBe(false);
    });

    it("at wait_tpkh_confirm (N3): ONLY tpkh can reject", () => {
      expect(canRejectBom(roles.tpkh, "wait_tpkh_confirm")).toBe(true);
      expect(canRejectBom(roles.rd, "wait_tpkh_confirm")).toBe(false);
      expect(canRejectBom(roles.nvkh, "wait_tpkh_confirm")).toBe(false);
      expect(canRejectBom(roles.sa, "wait_tpkh_confirm")).toBe(false);
    });

    it("at wait_accounting (N4): ONLY accounting can reject (tpkh/sa cannot)", () => {
      expect(canRejectBom(roles.kt, "wait_accounting")).toBe(false);
      expect(canRejectBom(roles.accounting, "wait_accounting")).toBe(true);
      expect(canRejectBom(roles.tpkh, "wait_accounting")).toBe(false);
      expect(canRejectBom(roles.sa, "wait_accounting")).toBe(false);
    });

    it("at wait_sa_approve (N5): ONLY sa can reject", () => {
      expect(canRejectBom(roles.sa, "wait_sa_approve")).toBe(true);
      expect(canRejectBom(roles.admin, "wait_sa_approve")).toBe(false);
      expect(canRejectBom(roles.tpkh, "wait_sa_approve")).toBe(false);
      expect(canRejectBom(roles.kt, "wait_sa_approve")).toBe(false);
    });

    it("closed or historical revisions can never be rejected", () => {
      expect(canRejectBom(roles.sa, "closed")).toBe(false);
      expect(canRejectBom(roles.sa, "wait_sa_approve", true)).toBe(false);
    });
  });

  describe("canApproveBom", () => {
    it("ONLY sa at wait_sa_approve can approve", () => {
      expect(canApproveBom(roles.sa, "wait_sa_approve")).toBe(true);
      expect(canApproveBom(roles.admin, "wait_sa_approve")).toBe(false);
      expect(canApproveBom(roles.tpkh, "wait_sa_approve")).toBe(false);
      expect(canApproveBom(roles.kt, "wait_sa_approve")).toBe(false);
      expect(canApproveBom(roles.sa, "wait_accounting")).toBe(false);
    });
  });

  describe("canEditTechnicalLines", () => {
    it("N1: only nvkh can edit lines", () => {
      expect(canEditTechnicalLines(roles.nvkh, "wait_nvkh")).toBe(true);
      expect(canEditTechnicalLines(roles.tpkh, "wait_nvkh")).toBe(false);
      expect(canEditTechnicalLines(roles.rd, "wait_nvkh")).toBe(false);
    });

    it("N2: only rd can edit lines", () => {
      expect(canEditTechnicalLines(roles.rd, "wait_rd")).toBe(true);
      expect(canEditTechnicalLines(roles.tpkh, "wait_rd")).toBe(false);
      expect(canEditTechnicalLines(roles.nvkh, "wait_rd")).toBe(false);
    });

    it("N3: only tpkh can edit lines", () => {
      expect(canEditTechnicalLines(roles.tpkh, "wait_tpkh_confirm")).toBe(true);
      expect(canEditTechnicalLines(roles.rd, "wait_tpkh_confirm")).toBe(false);
      expect(canEditTechnicalLines(roles.nvkh, "wait_tpkh_confirm")).toBe(false);
    });

    it("N4, N5, closed: nobody can edit technical lines", () => {
      expect(canEditTechnicalLines(roles.nvkh, "wait_accounting")).toBe(false);
      expect(canEditTechnicalLines(roles.tpkh, "wait_accounting")).toBe(false);
      expect(canEditTechnicalLines(roles.sa, "wait_sa_approve")).toBe(false);
      expect(canEditTechnicalLines(roles.nvkh, "closed")).toBe(false);
    });
  });

  describe("canEditUnitCost", () => {
    it("only accounting at wait_accounting can edit unit cost", () => {
      expect(canEditUnitCost(roles.kt, "wait_accounting")).toBe(false);
      expect(canEditUnitCost(roles.accounting, "wait_accounting")).toBe(true);
      expect(canEditUnitCost(roles.tpkh, "wait_accounting")).toBe(false);
      expect(canEditUnitCost(roles.sa, "wait_accounting")).toBe(false);
      expect(canEditUnitCost(roles.kt, "wait_tpkh_confirm")).toBe(false);
    });
  });

  describe("canEditDeadline and canEditRdNote", () => {
    it("cannot edit header when wait_sa_approve or closed", () => {
      expect(canEditDeadline(roles.nvkh, "wait_sa_approve")).toBe(false);
      expect(canEditDeadline(roles.sa, "wait_sa_approve")).toBe(false);
      expect(canEditRdNote(roles.rd, "wait_sa_approve")).toBe(false);
      expect(canEditDeadline(roles.nvkh, "closed")).toBe(false);
      expect(canEditRdNote(roles.rd, "closed")).toBe(false);
    });

    it("allowed in active workflow steps according to role", () => {
      expect(canEditDeadline(roles.nvkh, "wait_nvkh")).toBe(true);
      expect(canEditDeadline(roles.tpkh, "wait_rd")).toBe(true);
      expect(canEditDeadline(roles.rd, "wait_rd")).toBe(false);
      expect(canEditRdNote(roles.rd, "wait_rd")).toBe(true);
      expect(canEditRdNote(roles.nvkh, "wait_rd")).toBe(false);
    });
  });

  describe("canDiscontinueBom", () => {
    it("allows tpkh and sa to discontinue an active bom", () => {
      expect(canDiscontinueBom(roles.tpkh, "wait_nvkh")).toBe(true);
      expect(canDiscontinueBom(roles.sa, "wait_rd")).toBe(true);
      expect(canDiscontinueBom(roles.admin, "closed")).toBe(false);
      expect(canDiscontinueBom(roles.nvkh, "wait_nvkh")).toBe(false);
      expect(canDiscontinueBom(roles.tpkh, "discontinued")).toBe(false);
    });
  });

  describe("canCreateRevision", () => {
    it("allows creating revision only when bom is closed", () => {
      expect(canCreateRevision(roles.nvkh, "closed")).toBe(true);
      expect(canCreateRevision(roles.tpkh, "closed")).toBe(true);
      expect(canCreateRevision(roles.sa, "closed")).toBe(true);
      expect(canCreateRevision(roles.nvkh, "wait_nvkh")).toBe(false);
      expect(canCreateRevision(roles.viewer, "closed")).toBe(false);
    });
  });

  describe("canCopyFitBom", () => {
    it("allows copying from fit only for empty PO BOM at N1", () => {
      const validPoBom = { type: "po", status: "wait_nvkh", lines: [] };
      expect(canCopyFitBom(roles.nvkh, validPoBom)).toBe(true);
      expect(canCopyFitBom(roles.tpkh, validPoBom)).toBe(true);

      const nonEmptyPoBom = { type: "po", status: "wait_nvkh", lines: [{ id: "line-1" }] };
      expect(canCopyFitBom(roles.nvkh, nonEmptyPoBom)).toBe(false);

      const n2PoBom = { type: "po", status: "wait_rd", lines: [] };
      expect(canCopyFitBom(roles.nvkh, n2PoBom)).toBe(false);

      const fitBom = { type: "fit", status: "wait_nvkh", lines: [] };
      expect(canCopyFitBom(roles.nvkh, fitBom)).toBe(false);
    });
  });

  describe("Formatters", () => {
    it("formatUSD formats currency numbers", () => {
      expect(formatUSD(12.5)).toBe("$12.5000");
      expect(formatUSD(null)).toBe("—");
    });

    it("formatVND formats VND numbers", () => {
      expect(formatVND(100000)).toContain("100.000");
      expect(formatVND(null)).toBe("—");
    });

    it("formatDate formats dates", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate("2026-09-20T12:00:00Z")).not.toBe("—");
    });
  });

  describe("getAvailableRejectTargets", () => {
    it("returns correct target options matching BE REJECT_TRANSITIONS", () => {
      expect(getAvailableRejectTargets("wait_rd")).toEqual([
        { value: "wait_nvkh", label: "N1 - Trả về NVKH" },
      ]);
      expect(getAvailableRejectTargets("wait_tpkh_confirm")).toEqual([
        { value: "wait_rd", label: "N2 - Trả về R&D chỉnh định mức" },
        { value: "wait_nvkh", label: "N1 - Trả về NVKH" },
      ]);
      expect(getAvailableRejectTargets("wait_accounting")).toEqual([
        { value: "wait_tpkh_confirm", label: "N3 - Trả về TPKH" },
      ]);
      expect(getAvailableRejectTargets("wait_sa_approve")).toHaveLength(4);
    });
  });
});
