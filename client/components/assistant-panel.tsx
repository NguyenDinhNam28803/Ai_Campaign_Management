"use client";

import { useState } from "react";
import { useAssistantStream, type AssistantResult } from "@/lib/use-assistant-stream";
import { ASSISTANT_MODE_LABEL } from "@/lib/labels";
import type { AssistantMode } from "@/lib/types";
import { Button, Card } from "@/components/ui";

const MODES: AssistantMode[] = ["rewrite", "expand", "summarize", "translate", "tone"];

interface Props {
  pieceId: string;
  currentText: string;
  onApply: (newText: string) => void;
}

export function AssistantPanel({ pieceId, currentText, onApply }: Props) {
  const [mode, setMode] = useState<AssistantMode>("rewrite");
  const [result, setResult] = useState<AssistantResult | null>(null);

  const { streaming, partial, start, stop, reset } = useAssistantStream(
    pieceId,
    (r) => setResult(r),
  );

  const handleSend = () => {
    setResult(null);
    start(mode, currentText);
  };

  const handleApply = () => {
    onApply(partial);
    setResult(null);
  };

  const handleDiscard = () => {
    setResult(null);
    reset();
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <span className="text-[0.72rem] font-medium uppercase tracking-wide text-muted">
        Trợ lý AI
      </span>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={streaming}
            className={`rounded-md px-2 py-1 text-xs transition ${
              mode === m
                ? "bg-accent text-on-primary"
                : "bg-paper text-muted hover:bg-muted/10"
            } ${streaming ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {ASSISTANT_MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Idle state */}
      {!streaming && !partial && (
        <Button variant="primary" onClick={handleSend}>
          Gửi
        </Button>
      )}

      {/* Streaming state */}
      {streaming && (
        <div className="flex flex-col gap-2">
          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md border border-muted/15 bg-paper p-3 text-xs leading-relaxed">
            {partial}
            <span className="ml-0.5 animate-pulse text-accent">|</span>
          </div>
          <Button variant="secondary" onClick={stop}>
            Dừng
          </Button>
        </div>
      )}

      {/* Result state */}
      {!streaming && partial && (
        <div className="flex flex-col gap-2">
          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md border border-muted/15 bg-paper p-3 text-xs leading-relaxed">
            {partial}
          </div>
          {result && (
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Chi phí: ${result.costUsd}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleApply}>
              Áp dụng
            </Button>
            <Button variant="secondary" onClick={handleDiscard}>
              Hủy
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
