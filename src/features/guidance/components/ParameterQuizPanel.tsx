"use client";

import { useState, useMemo, useCallback } from "react";
import type { ProtocolConfig, PlannerParams } from "@/features/planner/types/planner";
import { formatParameterValue, getParameterOptions } from "@/features/guidance/lib/parameterDisplay";

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
        className="modal-scrim"
        onClick={onSkip}
      />

      <div
        className="modal-dialog animate-scale-in"
        style={{
          padding: 20,
          width: 380,
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
          PARAMETER QUIZ — {protocol.label}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 16 }}>
          {submitted ? (
            <span
              className="score-pill"
              style={{
                background: allCorrect ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.1)',
                color: allCorrect ? 'var(--fb-good)' : 'var(--fb-bad)',
                fontSize: 9,
              }}
            >
              Score: {score}% ({results?.filter((r) => r.correct).length}/{results?.length})
            </span>
          ) : (
            "Enter the correct parameter values from memory."
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {quizParams.map((key) => {
            const s = spec(key);
            const result = results?.find((r) => r.key === key);
            const options = getParameterOptions(key);
            return (
              <div key={key}>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>
                  {s?.label ?? key}
                  {s?.unit ? ` (${s.unit})` : ""}
                </div>
                {options ? (
                  <select
                    disabled={submitted}
                    value={answers[key] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="param-input"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      fontSize: 11,
                      fontFamily: "inherit",
                      background: "var(--input-bg)",
                      border: `1.5px solid ${
                        result
                          ? result.correct
                            ? "var(--fb-good)"
                            : "var(--fb-bad)"
                          : "var(--input-border)"
                      }`,
                      borderRadius: 5,
                      color: "var(--text-primary)",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <option value="">Select</option>
                    {options.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="?"
                    disabled={submitted}
                    value={answers[key] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="param-input"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      fontSize: 11,
                      fontFamily: "inherit",
                      background: "var(--input-bg)",
                      border: `1.5px solid ${
                        result
                          ? result.correct
                            ? "var(--fb-good)"
                            : "var(--fb-bad)"
                          : "var(--input-border)"
                      }`,
                      borderRadius: 5,
                      color: "var(--text-primary)",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                    }}
                  />
                )}
                {result && !result.correct && (
                  <div style={{ fontSize: 8, color: "var(--fb-bad)", marginTop: 4, fontWeight: 500 }}>
                    Correct: {formatParameterValue(key, result.target, s)}
                  </div>
                )}
                {result && result.correct && (
                  <div style={{ fontSize: 8, color: "var(--fb-good)", marginTop: 4, fontWeight: 500 }}>
                    Correct
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18, paddingTop: 14, justifyContent: "flex-end", borderTop: "1px solid var(--chrome-border-light)" }}>
          {!submitted ? (
            <>
              <button
                onClick={onSkip}
                className="btn-sm btn-ghost"
                style={{
                  padding: "5px 12px",
                  fontSize: 10,
                }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                className="btn-sm btn-primary"
                style={{
                  padding: "5px 16px",
                  fontSize: 10,
                  fontWeight: 500,
                }}
              >
                Check Answers
              </button>
            </>
          ) : (
            <button
              onClick={onComplete}
              className="btn-sm"
              style={{
                padding: "5px 16px",
                fontSize: 10,
                fontWeight: 500,
                background: allCorrect ? "rgba(63,185,80,0.15)" : "var(--accent-blue)",
                color: allCorrect ? "var(--fb-good)" : "#fff",
                border: allCorrect ? "1px solid rgba(63,185,80,0.3)" : "1px solid var(--accent-blue)",
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
