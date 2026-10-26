import { ConfigService } from '@nestjs/config';

/**
 * En producción las migraciones nunca se aplican al arrancar: se ejecutan
 * manualmente con `migration:run:guarded` y confirmación explícita.
 */
export function migracionesAutomaticasHabilitadas(config: ConfigService): boolean {
  const entorno = (config.get<string>('NODE_ENV') || '').trim().toLowerCase();
  if (entorno === 'production') return false;
  return (config.get<string>('DB_MIGRATIONS_RUN') || 'true').trim().toLowerCase() !== 'false';
}

export function confirmarMigracion(valor: string | undefined): void {
  if ((valor || '').trim().toUpperCase() !== 'YES') {
    throw new Error(
      'Migraciones bloqueadas. Revisa las migraciones pendientes y ejecuta con MIGRATE_CONFIRM=YES.',
    );
  }
}
