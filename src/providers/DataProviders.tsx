import type { ReactNode } from 'react'
import { ProfileProvider } from '@/hooks/useProfile'
import { PeriodsAdminProvider } from '@/hooks/usePeriodsAdmin'
import { IcvRecordsProvider } from '@/hooks/useIcvRecords'
import { AffiliatesProvider } from '@/hooks/useAffiliates'
import { PaymentsProvider } from '@/hooks/usePayments'
import { ContactsProvider } from '@/hooks/useContacts'

/**
 * Monta, una sola vez por encima de las rutas, los datos que antes se volvían a pedir a
 * Supabase cada vez que se entraba a una página (perfil, períodos, ICV, afiliados, pagos y
 * contactos) — ver createHookContext.tsx para el porqué. Al estar fuera de <Routes>, no se
 * desmonta al navegar, así que la navegación entre secciones reutiliza los datos ya cargados
 * en vez de mostrar la pantalla de carga de nuevo cada vez.
 */
export function DataProviders({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <PeriodsAdminProvider>
        <IcvRecordsProvider>
          <AffiliatesProvider>
            <PaymentsProvider>
              <ContactsProvider>{children}</ContactsProvider>
            </PaymentsProvider>
          </AffiliatesProvider>
        </IcvRecordsProvider>
      </PeriodsAdminProvider>
    </ProfileProvider>
  )
}
