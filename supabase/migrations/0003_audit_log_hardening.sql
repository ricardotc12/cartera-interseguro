-- =============================================================================
-- Revisión de seguridad (Fase 7): dos huecos en audit_log que no son explotables
-- hoy (solo existe un usuario) pero sí lo serían en cuanto haya un segundo usuario
-- en el mismo proyecto (ver decisión de "un solo usuario ahora, preparado para más"):
--
-- 1) "audit_log_select" dejaba leer a CUALQUIER usuario autenticado el historial
--    de auditoría de TODOS los usuarios (incluye datos completos de afiliados,
--    pólizas, pagos y reglas de cualquiera). Se restringe a las propias filas.
-- 2) "audit_log_insert" dejaba a cualquier cliente autenticado insertar filas
--    directamente en audit_log (sin pasar por el trigger), incluso falsificando
--    a quién se le atribuye el cambio (changed_by). Se elimina esa política: de
--    ahora en adelante solo el trigger (ejecutado como SECURITY DEFINER, dueño
--    de la tabla) puede escribir en audit_log; ningún cliente puede insertar,
--    actualizar ni borrar filas de auditoría directamente.
-- =============================================================================

drop policy if exists "audit_log_select" on audit_log;
create policy "audit_log_select_own" on audit_log for select to authenticated using (changed_by = auth.uid());

drop policy if exists "audit_log_insert" on audit_log;
-- Sin política de insert/update/delete para 'authenticated': con RLS activo y sin
-- políticas que lo permitan, el acceso queda denegado por defecto para el cliente.

create or replace function audit_trigger_fn()
returns trigger
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    insert into audit_log (table_name, record_id, action, old_data, changed_by)
    values (tg_table_name, old.id, 'delete', to_jsonb(old), auth.uid());
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, new.id, 'update', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  else
    insert into audit_log (table_name, record_id, action, new_data, changed_by)
    values (tg_table_name, new.id, 'insert', to_jsonb(new), auth.uid());
    return new;
  end if;
end;
$$ language plpgsql;

-- Nota para cuando agregues un segundo usuario (ej. tu pareja) al mismo proyecto:
-- las políticas de policies/payments/incentive_rules/collection_factor_rules/icv_factor_rules
-- validan que `created_by = auth.uid()`, pero NO validan todavía que el `affiliate_id`
-- o `period_id` referenciado pertenezca también a ese mismo usuario. Hoy no es explotable
-- porque solo tu cuenta existe, pero antes de dar de alta un segundo usuario conviene
-- agregar esa validación cruzada (con un trigger BEFORE INSERT o políticas RLS con subconsulta).
