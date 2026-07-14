import { describe, it, expect } from "vitest";
import {
  CONTENT_STATUS_LABEL,
  JOB_STATUS_LABEL,
  VERSION_SOURCE_LABEL,
  CONTENT_TYPE_LABEL,
} from "./labels";

describe("labels", () => {
  it("mọi nhãn đều là chuỗi không rỗng", () => {
    for (const map of [
      CONTENT_STATUS_LABEL,
      JOB_STATUS_LABEL,
      VERSION_SOURCE_LABEL,
      CONTENT_TYPE_LABEL,
    ]) {
      for (const v of Object.values(map)) {
        expect(typeof v).toBe("string");
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it("nhãn trạng thái nội dung đúng tiếng Việt", () => {
    expect(CONTENT_STATUS_LABEL.IN_REVIEW).toBe("Chờ duyệt");
    expect(CONTENT_STATUS_LABEL.DRAFT).toBe("Nháp");
    expect(CONTENT_STATUS_LABEL.PUBLISHED).toBe("Đã đăng");
  });

  it("không lộ enum thô ra nhãn", () => {
    expect(Object.values(CONTENT_STATUS_LABEL)).not.toContain("IN_REVIEW");
    expect(Object.values(VERSION_SOURCE_LABEL)).not.toContain("AI_DRAFT");
  });
});
