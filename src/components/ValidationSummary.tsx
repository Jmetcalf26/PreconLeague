import { usd } from "@/lib/format";
import type { ValidationResult } from "@/lib/validation";

export function ValidationSummary({
  validation,
}: {
  validation: ValidationResult;
}) {
  const { ok, violations, budget, changes } = validation;
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");
  const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;

  return (
    <div className="card-panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Rules check</h2>
        <span
          className={`chip ${
            ok
              ? "bg-green-500/15 text-green-300"
              : "bg-red-500/15 text-red-300"
          }`}
        >
          {ok ? "✓ Legal" : `✕ ${errors.length} issue${errors.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-ink-400">Upgrade budget</span>
          <span className={budget.spent > budget.limit ? "font-semibold text-red-400" : "text-ink-200"}>
            {usd(budget.spent)} / {usd(budget.limit)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className={`h-full rounded-full ${budget.spent > budget.limit ? "bg-red-500" : "bg-brand-500"}`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {budget.remaining >= 0
            ? `${usd(budget.remaining)} of upgrades remaining`
            : `${usd(-budget.remaining)} over budget`}
        </p>
      </div>

      {changes.enforced && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400">Card changes</span>
          <span className="flex gap-3">
            <span className={changes.land > changes.maxLand ? "font-semibold text-red-400" : "text-ink-200"}>
              {changes.land} / {changes.maxLand} lands
            </span>
            <span className={changes.nonland > changes.maxNonland ? "font-semibold text-red-400" : "text-ink-200"}>
              {changes.nonland} / {changes.maxNonland} non-lands
            </span>
          </span>
        </div>
      )}

      {(errors.length > 0 || warnings.length > 0) && (
        <ul className="space-y-1.5 text-sm">
          {errors.map((v, i) => (
            <li key={`e${i}`} className="flex gap-2 text-red-300">
              <span>✕</span>
              <span>{v.message}</span>
            </li>
          ))}
          {warnings.map((v, i) => (
            <li key={`w${i}`} className="flex gap-2 text-amber-300">
              <span>!</span>
              <span>{v.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
