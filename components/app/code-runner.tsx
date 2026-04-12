"use client";

import { useState } from "react";
import { Check, Play, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TestCase = {
  args: unknown[];
  expected: unknown;
};

export type TestResult = {
  args: unknown[];
  expected: unknown;
  actual: unknown;
  passed: boolean;
  error?: string;
};

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}

function runJavaScript(
  code: string,
  functionName: string,
  testCases: TestCase[],
): TestResult[] {
  return testCases.map((tc) => {
    try {
      // Strip TypeScript type annotations for JS execution
      const jsCode = code
        .replace(/:\s*number\[\]/g, "")
        .replace(/:\s*number\[\]\[\]/g, "")
        .replace(/:\s*number/g, "")
        .replace(/:\s*string\[\]/g, "")
        .replace(/:\s*string/g, "")
        .replace(/:\s*boolean/g, "")
        .replace(/:\s*void/g, "");

      const wrappedCode = `
        ${jsCode}
        return ${functionName}(...__args__);
      `;

      const fn = new Function("__args__", wrappedCode);

      let actual: unknown;
      const timeout = 5000;
      const start = performance.now();

      actual = fn(tc.args);

      if (performance.now() - start > timeout) {
        return {
          args: tc.args,
          expected: tc.expected,
          actual: undefined,
          passed: false,
          error: "Time limit exceeded (5s)",
        };
      }

      const passed = deepEqual(actual, tc.expected);
      return { args: tc.args, expected: tc.expected, actual, passed };
    } catch (err) {
      return {
        args: tc.args,
        expected: tc.expected,
        actual: undefined,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function CodeRunner({
  code,
  functionName,
  testCases,
}: {
  code: string;
  functionName: string;
  testCases: TestCase[];
}) {
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);

  function handleRun() {
    setRunning(true);
    // Use setTimeout to let the UI update before blocking execution
    setTimeout(() => {
      const r = runJavaScript(code, functionName, testCases);
      setResults(r);
      setRunning(false);
    }, 50);
  }

  const passCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;
  const allPassed = results !== null && passCount === totalCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className={cn(
            "btn btn-sm gap-2",
            allPassed
              ? "btn-success"
              : "btn-primary",
          )}
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {running ? "Running..." : "Run Code"}
        </button>

        {results !== null && (
          <span
            className={cn(
              "text-sm font-medium",
              allPassed ? "text-success" : "text-error",
            )}
          >
            {passCount}/{totalCount} passed
          </span>
        )}
      </div>

      {results !== null && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                "border px-3 py-2.5 text-sm",
                r.passed
                  ? "border-success/30 bg-success/10"
                  : "border-error/30 bg-error/10",
              )}
            >
              <div className="flex items-center gap-2">
                {r.passed ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <X className="size-3.5 text-error" />
                )}
                <span className="font-medium">
                  Test {i + 1}: {r.passed ? "Passed" : "Failed"}
                </span>
              </div>

              {!r.passed && (
                <div className="mt-2 space-y-1 pl-5.5 font-mono text-xs">
                  <p>
                    <span className="text-base-content/60">Input: </span>
                    {formatValue(r.args)}
                  </p>
                  <p>
                    <span className="text-base-content/60">Expected: </span>
                    {formatValue(r.expected)}
                  </p>
                  <p>
                    <span className="text-base-content/60">Got: </span>
                    <span className={r.error ? "text-rose-600" : ""}>
                      {r.error ?? formatValue(r.actual)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
