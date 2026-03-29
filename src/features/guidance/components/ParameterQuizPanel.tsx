"use client";

import { useState, useMemo, useCallback } from "react";
import type { ProtocolConfig, PlannerParams } from "@/features/planner/types/planner";

interface ParameterQuizPanelProps {
  open: boolean;
  protocol: ProtocolConfig;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * After the parameter tutorial, this panel clears key parameter values
 * and asks the student to fill them from memory. Validates against target.
 */
export function ParameterQuizPanel({
  open,
  protocol,
  onComplete,
  onSkip,
}: ParameterQuizPanelProps) {
  const quizParams = useMemo(() => {
    // Pick the teaching-highlighted params for the quiz
    const highlights = protocol.teaching?.parameterHighlights ?? [];
    if (highlights.length === 0) {
      // Fallback: quiz on TR, TE, FOV
      return ["TR", "TE", "FOV"].filter((k) => k in protocol.target.params);
    }
    return highlights.map((h) => h.key).filter((k) => k in protocol.target.params);
  }, [protocol]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    if (!submitted) return null;
    return quizParams.map((key) => {
      const target = protocol.target.params[key];
      const answer = parseFloat(answers[key] ?? "");
      const tolerance = Math.max(Math.abs(target) * 0.15, 1);
      const correct = !isNaN(answer) && Math.abs(answer - target) <= tolerance;
      return { key, target, answer, correct };
    });
  }, [submitted, quizParams, protocol.target.params, answers]);

  const allCorrect = results?.every((r) => r.correct) ?? false;
  const score = results
    ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
    : 0;

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
  }, []);

  if (!open) return null;

  const spec = (key: string) =>
    protocol.parameterSpecs.find((s) => String(s.key) === key);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
        onClick={onSkip}
      />

      <div
        className="animate-scale-in"
        style={{
          position: "relative",
          background: "var(--chrome-surface)",
          border: "1px solid var(--chrome-border)",
          borderRadius: 8,
          padding: 20,
          width: 360,
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          PARAMETER QUIZ — {protocol.label}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 16 }}>
          {submitted
            ? `Score: ${score}% (${results?.filter((r) => r.correct).length}/${results?.length})`
            : "Enter the correct parameter values from memory."}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quizParams.map((key) => {
            const s = spec(key);
            const result = results?.find((r) => r.key === key);
            return (
              <div key={key}>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", marginBottom: 2 }}>
                  {s?.label ?? key}
                  {s?.unit ? ` (${s.unit})` : ""}
                </div>
                <input
                  type="number"
                  placeholder="?"
                  disabled={submitted}
                  value={answers[key] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "4px 8px",
                    fontSize: 11,
                    fontFamily: "inherit",
                    background: "var(--input-bg)",
                    border: `1px solid ${
                      result
                        ? result.correct
                          ? "var(--fb-good)"
                          : "var(--fb-bad)"
                        : "var(--input-border)"
                    }`,
                    borderRadius: 4,
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                {result && !result.correct && (
                  <div style={{ fontSize: 8, color: "var(--fb-bad)", marginTop: 2 }}>
                    Correct: {result.target}
                    {s?.unit ? ` ${s.unit}` : ""}
                  </div>
                )}
                {result && result.correct && (
                  <div style={{ fontSize: 8, color: "var(--fb-good)", marginTop: 2 }}>
                    Correct
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          {!submitted ? (
            <>
              <button
                onClick={onSkip}
                style={{
                  padding: "4px 12px",
                  fontSize: 10,
                  borderRadius: 4,
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--chrome-border)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: "4px 16px",
                  fontSize: 10,
                  borderRadius: 4,
                  background: "var(--accent-blue)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Check Answers
              </button>
            </>
          ) : (
            <button
              onClick={allCorrect ? onComplete : onComplete}
              style={{
                padding: "4px 16px",
                fontSize: 10,
                borderRadius: 4,
                background: allCorrect ? "rgba(63,185,80,0.15)" : "var(--accent-blue)",
                color: allCorrect ? "var(--fb-good)" : "#fff",
                border: allCorrect ? "1px solid rgba(63,185,80,0.3)" : "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {allCorrect ? "Perfect — Continue" : "Continue to Planning"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
