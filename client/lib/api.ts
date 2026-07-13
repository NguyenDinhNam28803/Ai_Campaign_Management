// Fetch wrapper gọi NestJS API. Xác thực bằng httpOnly cookie (S-03) —
// KHÔNG lưu token trong JS/localStorage; cookie tự đính kèm qua credentials:'include'.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4500";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ReqOptions {
  method?: string;
  body?: unknown;
}

export async function api<T = unknown>(
  path: string,
  opts: ReqOptions = {},
): Promise<T> {
  const { method = "GET", body } = opts;

  const res = await fetch(BASE + path, {
    method,
    credentials: "include", // gửi/nhận httpOnly cookie
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 401 = chưa đăng nhập / hết phiên. Điều hướng về /login (trừ khi đang thao tác auth).
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login") &&
    !path.startsWith("/auth/")
  ) {
    window.location.href = "/login";
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message?.toString?.() || data.error)) || `Lỗi ${res.status}`;
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(", ") : message,
    );
  }
  return data as T;
}
