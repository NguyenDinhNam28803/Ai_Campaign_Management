import { describe, it, expect } from "vitest";
import { isAdmin, isManager, canManageContent } from "./rbac";

describe("rbac", () => {
  it("isAdmin chỉ đúng với ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("MANAGER")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("isManager đúng với ADMIN và MANAGER", () => {
    expect(isManager("ADMIN")).toBe(true);
    expect(isManager("MANAGER")).toBe(true);
    expect(isManager("EDITOR")).toBe(false);
    expect(isManager("WRITER")).toBe(false);
    expect(isManager(undefined)).toBe(false);
  });

  it("canManageContent: mọi vai trò trừ WRITER (và phải có vai trò)", () => {
    expect(canManageContent("ADMIN")).toBe(true);
    expect(canManageContent("MANAGER")).toBe(true);
    expect(canManageContent("EDITOR")).toBe(true);
    expect(canManageContent("WRITER")).toBe(false);
    expect(canManageContent(undefined)).toBe(false);
  });
});
