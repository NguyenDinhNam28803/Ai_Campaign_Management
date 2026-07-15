"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import type { AssistantMode } from "@/lib/types";

export interface AssistantResult {
  text: string;
  generationId: string;
  costUsd: string;
}

export function useAssistantStream(
  pieceId: string,
  onDone?: (result: AssistantResult) => void,
) {
  const toast = useToast();
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setPartial("");
  }, [stop]);

  const start = useCallback(
    (mode: AssistantMode, text: string) => {
      stop();
      setStreaming(true);
      setPartial("");

      const controller = new AbortController();
      controllerRef.current = controller;

      fetch("/api/assistant/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode, text, pieceId }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${errBody}`);
          }
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No body");
          const decoder = new TextDecoder();
          let buffer = "";
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.done) {
                    setStreaming(false);
                    onDone?.({
                      text: fullText,
                      generationId: data.generationId,
                      costUsd: data.costUsd,
                    });
                  } else {
                    fullText += data.text;
                    setPartial(fullText);
                  }
                } catch {
                  // ignore malformed SSE lines
                }
              }
            }
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            toast(
              err instanceof Error ? err.message : "Lỗi streaming",
              "error",
            );
            setStreaming(false);
          }
        });
    },
    [pieceId, toast, onDone, stop],
  );

  return { streaming, partial, start, stop, reset };
}
