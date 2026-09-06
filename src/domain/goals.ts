import type { GoalProgress } from '@/types/domain'

/** Cumplimiento de una meta: % alcanzado y monto faltante. No confunde meta con tramo de incentivo, ICV o cobranza — cada una se evalúa contra su propia meta. */
export function calculateGoalProgress(goal: number, actual: number): GoalProgress {
  const compliancePct = goal > 0 ? actual / goal : 0
  const remaining = Math.max(goal - actual, 0)
  return { goal, actual, compliancePct, remaining }
}
