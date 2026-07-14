"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resources } from "./resources";
import { useToast } from "@/components/toast";
import type { AIGeneration } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gọi AI sinh nháp cho một content piece rồi poll job tới khi xong.
 * Tự dừng khi component unmount — không setState/gọi API sau unmount (fix rò rỉ).
 * `onDone` chạy khi job DONE (thường là reload danh sách phiên bản).
 */
export function useGenerationPolling(pieceId: string, onDone?: () => void) {
  const toast = useToast();
  const [gen, setGen] = useState<AIGeneration | null>(null);
  const [generating, setGenerating] = useState(false);
  const cancelled = useRef(false);

  // Hủy vòng poll khi unmount.
  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  const stop = useCallback(() => {
    cancelled.current = true;
    setGenerating(false);
  }, []);

  const start = useCallback(async () => {
    cancelled.current = false;
    setGenerating(true);
    setGen(null);
    try {
      const { generationId } = await resources.content.generate(pieceId);
      for (let i = 0; i < 45 && !cancelled.current; i++) {
        await sleep(i < 5 ? 1000 : i < 12 ? 3000 : 5000);
        if (cancelled.current) return;
        const g = await resources.generations.get(generationId);
        if (cancelled.current) return;
        setGen(g);
        if (g.status === "DONE") {
          toast("AI đã sinh xong bản nháp", "success");
          onDone?.();
          return;
        }
        if (g.status === "FAILED") {
          toast("AI sinh thất bại — xem chi tiết lỗi", "error");
          return;
        }
      }
    } catch (e) {
      if (!cancelled.current) {
        toast(e instanceof Error ? e.message : "Lỗi gọi AI", "error");
      }
    } finally {
      if (!cancelled.current) setGenerating(false);
    }
  }, [pieceId, toast, onDone]);

  return { gen, generating, start, stop };
}
