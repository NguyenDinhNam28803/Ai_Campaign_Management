import type { Role } from "./types";

/** Helper phân quyền phía UI (chốt chặn thật vẫn ở backend). */
export const isAdmin = (role?: Role) => role === "ADMIN";
export const isManager = (role?: Role) => role === "ADMIN" || role === "MANAGER";
/** Tạo/sửa mọi nội dung: ADMIN/MANAGER/EDITOR (WRITER chỉ của mình — backend kiểm). */
export const canManageContent = (role?: Role) => role !== "WRITER" && !!role;
