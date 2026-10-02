import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PROTECTION_TYPES } from '@/domain'
import { CoverageList } from './shared'

const COVERAGE_DEFINITIONS = [
  {
    term: 'Fallecimiento',
    description: 'Pago del monto asegurado a los beneficiarios ante el fallecimiento del asegurado, por cualquier causa cubierta por la póliza.',
  },
  {
    term: 'Fallecimiento por accidente',
    description: 'Pago adicional o específico cuando el fallecimiento ocurre como consecuencia directa de un accidente.',
  },
  {
    term: 'Invalidez total',
    description: 'Cobertura ante una invalidez total y permanente del asegurado, según las condiciones definidas en la póliza.',
  },
  {
    term: 'Enfermedades graves e intervenciones',
    description: 'Cobertura ante el diagnóstico de una enfermedad grave o la necesidad de una intervención cubierta por la póliza.',
  },
]

/** Catálogo de referencia de las 3 alternativas de protección y sus coberturas (sección 18, "Glosario Coberturas"). Contenido fijo, tal como lo definió la asesora. */
export function CoverageGlossaryTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PROTECTION_TYPES.map((pt) => (
          <Card key={pt.id}>
            <CardHeader>
              <p className="text-base font-semibold text-slate-900">{pt.label}</p>
            </CardHeader>
            <CardBody>
              <CoverageList protectionType={pt.id} />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <p className="text-base font-semibold text-slate-900">¿Qué significa cada cobertura?</p>
        </CardHeader>
        <CardBody className="space-y-3">
          {COVERAGE_DEFINITIONS.map((c) => (
            <div key={c.term}>
              <p className="text-sm font-semibold text-slate-800">{c.term}</p>
              <p className="text-sm text-slate-500">{c.description}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
