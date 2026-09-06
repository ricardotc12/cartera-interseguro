import { useMemo } from 'react'
import { usePeriodsHistory } from './usePeriodsHistory'
import { useIcvRecords } from './useIcvRecords'
import {
  calculateBaseIncentive,
  calculateCollectionFactor,
  calculateFinalIncentive,
  calculateICVFactor,
  calculateIncentivePercentage,
} from '@/domain'
import type { PeriodWithRules } from './usePeriodsAdmin'

export interface PeriodReportRow {
  periodId: string
  name: string
  startDate: string
  endDate: string
  status: string
  vidaEmission: number
  vidaEmissionGoal: number
  incentivePercentage: number | null
  baseIncentive: number | null
  collectionRatio: number | null
  collectionFactor: number | null
  icvPercentage: number | null
  icvFactor: number | null
  finalIncentive: number | null
}

/** Reporte histórico completo por período: Emisión Vida, Incentivos, Factor Cobranza e ICV (sección 30). */
export function usePeriodsReport(periods: PeriodWithRules[]) {
  const { history, loading: historyLoading, error: historyError } = usePeriodsHistory(periods)
  const { getForPeriod, loading: icvLoading } = useIcvRecords()

  const rows: PeriodReportRow[] = useMemo(() => {
    return history.map((point) => {
      const period = periods.find((p) => p.id === point.periodId)
      if (!period) {
        return {
          periodId: point.periodId,
          name: point.name,
          startDate: point.startDate,
          endDate: point.startDate,
          status: '',
          vidaEmission: point.vidaEmission,
          vidaEmissionGoal: point.vidaEmissionGoal,
          incentivePercentage: null,
          baseIncentive: null,
          collectionRatio: point.collectionRatio,
          collectionFactor: null,
          icvPercentage: null,
          icvFactor: null,
          finalIncentive: null,
        }
      }

      const incentivePercentage = calculateIncentivePercentage(point.vidaEmission, period.incentiveRules)
      const baseIncentive = incentivePercentage != null ? calculateBaseIncentive(point.vidaEmission, incentivePercentage) : null
      const collectionFactor =
        point.collectionRatio != null ? calculateCollectionFactor(point.collectionRatio, period.collectionFactorRules) : null
      const icvRecord = getForPeriod(period.id)
      const icvFactor = icvRecord ? calculateICVFactor(icvRecord.icvPercentage, period.icvFactorRules) : null
      const finalIncentive =
        baseIncentive != null && collectionFactor != null && icvFactor != null
          ? calculateFinalIncentive(baseIncentive, collectionFactor, icvFactor)
          : null

      return {
        periodId: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        vidaEmission: point.vidaEmission,
        vidaEmissionGoal: point.vidaEmissionGoal,
        incentivePercentage,
        baseIncentive,
        collectionRatio: point.collectionRatio,
        collectionFactor,
        icvPercentage: icvRecord?.icvPercentage ?? null,
        icvFactor,
        finalIncentive,
      }
    })
  }, [history, periods, getForPeriod])

  return { rows, loading: historyLoading || icvLoading, error: historyError }
}
