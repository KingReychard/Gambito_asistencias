// =====================================================
// GAMBITO — EDGE FUNCTION calcular_puntos_asistencia (v3)
// Fecha: 8 de Mayo de 2026
//
// Trigger: Database Webhook en INSERT a public.asistencia
//
// CAMBIOS vs v2:
//   1. Lookup de puntos_config ahora usa el RPC
//      obtener_valor_puntos_config(p_clave, p_id_modulo) creado en
//      gambito_puntos_modular_paso1_fix.sql, que devuelve el override
//      del módulo si existe o el global como fallback.
//   2. Antes de calcular puntos, se obtiene el id_modulo_actual del
//      alumno (puede ser NULL → fallback al valor global).
//   3. El motivo del log incluye el nombre del módulo (cuando aplica)
//      para hacer fácil distinguir "+30 [Peón 1]" vs "+10 [Caballo 1]"
//      en puntos_log.
//   4. La response incluye `modulo` para facilitar el debug.
//
// Lógica (sin cambios respecto a v2):
// 1. Filtros tempranos: solo INSERTs con asistio=true y puntos_otorgados=0
// 2. Mapea tipo_clase a clave de puntos_config:
//      ajedrez → asistencia_clase
//      lectura → asistencia_taller_lectura
//      torneo, curso_verano → 422
// 3. Resuelve id_temporada por fecha si no viene en el record.
// 4. Suma puntos atómicamente vía RPC sumar_puntos_categoria.
// 5. Inserta fila en puntos_log con motivo legible.
// 6. Cierra el flag de idempotencia (UPDATE puntos_otorgados).
// 7. Si es la primera asistencia=true a tipo_clase='ajedrez' del alumno,
//    otorga el badge "Primera clase" (+30 a puntos_badges + log).
// =====================================================

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ===== Tipos =====

interface AsistenciaRecord {
  id: string
  id_alumno: string
  id_temporada: string | null
  fecha: string
  asistio: boolean
  puntos_otorgados: number
  tipo_clase: string
  migrado_desde_notion: boolean
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: AsistenciaRecord | null
  old_record: AsistenciaRecord | null
}

type CategoriaPuntos =
  | 'puntos_asistencia'
  | 'puntos_partidas'
  | 'puntos_graduacion'
  | 'puntos_badges'
  | 'puntos_ejercicios'
  | 'puntos_penalizaciones'

// ===== Constantes =====

const TIPO_CLASE_TO_CONFIG_KEY: Record<string, string> = {
  ajedrez: 'asistencia_clase',
  lectura: 'asistencia_taller_lectura',
  // 'torneo' y 'curso_verano' están permitidos por el CHECK pero sin clave en
  // puntos_config: la función responde 422 hasta que se agregue el valor.
}

// ===== Utilidades =====

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Obtiene el valor de puntos_config con soporte modular.
 * Si idModulo es null o no hay override → devuelve el valor global.
 * Si idModulo tiene override → devuelve el valor del módulo.
 * Lanza error si la clave no existe globalmente.
 */
async function getConfigValor(
  supabase: SupabaseClient,
  clave: string,
  idModulo: string | null = null,
): Promise<number> {
  const { data, error } = await supabase.rpc('obtener_valor_puntos_config', {
    p_clave: clave,
    p_id_modulo: idModulo,
  })
  if (error) {
    throw new Error(`Error en RPC obtener_valor_puntos_config(${clave}): ${error.message}`)
  }
  if (data === null || data === undefined) {
    throw new Error(`puntos_config[${clave}] no tiene valor global definido`)
  }
  return data as number
}

async function resolverIdTemporada(supabase: SupabaseClient, fecha: string): Promise<string> {
  const { data, error } = await supabase
    .from('temporadas')
    .select('id')
    .lte('fecha_inicio', fecha)
    .gte('fecha_fin', fecha)
    .maybeSingle()
  if (error) throw new Error(`Error consultando temporadas: ${error.message}`)
  if (!data) throw new Error(`No hay temporada que cubra la fecha ${fecha}`)
  return data.id
}

/**
 * Obtiene el id_modulo_actual del alumno y el nombre del módulo (si aplica).
 * Si el alumno no tiene módulo asignado, devuelve { idModulo: null, nombreModulo: null }.
 */
async function obtenerModuloAlumno(
  supabase: SupabaseClient,
  idAlumno: string,
): Promise<{ idModulo: string | null; nombreModulo: string | null }> {
  const { data: alumno, error: alumnoError } = await supabase
    .from('alumnos')
    .select('id_modulo_actual')
    .eq('id', idAlumno)
    .single()

  if (alumnoError || !alumno) {
    throw new Error(`No se pudo obtener el alumno ${idAlumno}: ${alumnoError?.message ?? 'no row'}`)
  }

  if (!alumno.id_modulo_actual) {
    return { idModulo: null, nombreModulo: null }
  }

  const { data: modulo, error: moduloError } = await supabase
    .from('modulos')
    .select('nombre')
    .eq('id', alumno.id_modulo_actual)
    .maybeSingle()

  if (moduloError) {
    // No es bloqueante: el id_modulo está, solo no pudimos resolver el nombre
    console.warn(`No se pudo obtener nombre del módulo ${alumno.id_modulo_actual}: ${moduloError.message}`)
  }

  return {
    idModulo: alumno.id_modulo_actual,
    nombreModulo: modulo?.nombre ?? null,
  }
}

async function sumarPuntos(
  supabase: SupabaseClient,
  idAlumno: string,
  idTemporada: string,
  categoria: CategoriaPuntos,
  delta: number,
) {
  // Llamada atómica a la función SQL — sin race condition.
  const { error } = await supabase.rpc('sumar_puntos_categoria', {
    p_id_alumno: idAlumno,
    p_id_temporada: idTemporada,
    p_categoria: categoria,
    p_delta: delta,
  })
  if (error) {
    throw new Error(`Error en sumar_puntos_categoria(${categoria}, ${delta}): ${error.message}`)
  }
}

async function logPuntos(
  supabase: SupabaseClient,
  args: {
    idAlumno: string
    idTemporada: string
    categoria: 'asistencia' | 'badge'
    puntos: number
    motivo: string
    referenciaTipo: string
    referenciaId: string
  },
) {
  const { error } = await supabase.from('puntos_log').insert({
    id_alumno: args.idAlumno,
    id_temporada: args.idTemporada,
    categoria: args.categoria,
    puntos: args.puntos,
    motivo: args.motivo,
    referencia_tipo: args.referenciaTipo,
    referencia_id: args.referenciaId,
  })
  if (error) throw new Error(`Error en puntos_log insert: ${error.message}`)
}

async function otorgarBadgePrimeraClase(
  supabase: SupabaseClient,
  idAlumno: string,
  idTemporada: string,
): Promise<{ otorgado: boolean }> {
  // Contar asistencias=true a tipo_clase='ajedrez' (incluye la actual,
  // que ya fue insertada antes del webhook).
  const { count, error: countError } = await supabase
    .from('asistencia')
    .select('*', { count: 'exact', head: true })
    .eq('id_alumno', idAlumno)
    .eq('asistio', true)
    .eq('tipo_clase', 'ajedrez')

  if (countError) throw new Error(`Error contando asistencias: ${countError.message}`)
  if (count !== 1) return { otorgado: false }

  const { data: logro, error: logroError } = await supabase
    .from('logros')
    .select('id')
    .eq('nombre', 'Primera clase')
    .single()

  if (logroError || !logro) {
    console.warn('No se encontró el logro "Primera clase". Saltando badge.')
    return { otorgado: false }
  }

  // INSERT en alumno_logros — UNIQUE constraint protege contra duplicados.
  const { data: alumnoLogro, error: insertError } = await supabase
    .from('alumno_logros')
    .insert({
      id_alumno: idAlumno,
      id_logro: logro.id,
      id_temporada: idTemporada,
    })
    .select('id')
    .single()

  if (insertError) {
    // Probablemente UNIQUE violation: el alumno ya tenía el badge.
    console.warn(`Insert en alumno_logros falló (probablemente ya existía): ${insertError.message}`)
    return { otorgado: false }
  }

  // Por ahora el valor del badge no se modula por nivel (siempre 30).
  // Si en el futuro se quisiera variar, basta con pasar idModulo aquí.
  const valorBadge = await getConfigValor(supabase, 'badge_ganado')
  await sumarPuntos(supabase, idAlumno, idTemporada, 'puntos_badges', valorBadge)
  await logPuntos(supabase, {
    idAlumno,
    idTemporada,
    categoria: 'badge',
    puntos: valorBadge,
    motivo: 'Badge: Primera clase',
    referenciaTipo: 'alumno_logros',
    referenciaId: alumnoLogro.id,
  })

  return { otorgado: true }
}

// ===== Handler principal =====

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()

    // Filtros tempranos
    if (payload.type !== 'INSERT' || payload.table !== 'asistencia' || !payload.record) {
      return jsonResponse({ ok: true, skipped: 'not an asistencia insert' })
    }

    const record = payload.record

    if (!record.asistio) {
      return jsonResponse({ ok: true, skipped: 'asistio=false' })
    }

    if (record.puntos_otorgados !== 0) {
      return jsonResponse({ ok: true, skipped: 'already processed' })
    }

    const configKey = TIPO_CLASE_TO_CONFIG_KEY[record.tipo_clase]
    if (!configKey) {
      return jsonResponse(
        {
          ok: false,
          error: `tipo_clase '${record.tipo_clase}' no tiene clave en puntos_config. Agrega la clave antes de insertar.`,
        },
        422,
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Obtener módulo del alumno (puede ser null)
    const { idModulo, nombreModulo } = await obtenerModuloAlumno(supabase, record.id_alumno)

    // Obtener valor de puntos con override modular si aplica
    const valorPuntos = await getConfigValor(supabase, configKey, idModulo)
    const idTemporada =
      record.id_temporada ?? (await resolverIdTemporada(supabase, record.fecha))

    // 1. Sumar puntos de asistencia (atómico)
    await sumarPuntos(
      supabase,
      record.id_alumno,
      idTemporada,
      'puntos_asistencia',
      valorPuntos,
    )

    // 2. Log con motivo enriquecido (incluye módulo cuando aplica)
    const sufijoModulo = nombreModulo ? ` [${nombreModulo}]` : ''
    const motivo =
      record.tipo_clase === 'lectura'
        ? `Asistencia al taller de lectura del ${record.fecha}${sufijoModulo}`
        : `Asistencia a clase del ${record.fecha}${sufijoModulo}`

    await logPuntos(supabase, {
      idAlumno: record.id_alumno,
      idTemporada,
      categoria: 'asistencia',
      puntos: valorPuntos,
      motivo,
      referenciaTipo: 'asistencia',
      referenciaId: record.id,
    })

    // 3. Cerrar flag de idempotencia
    const { error: updateError } = await supabase
      .from('asistencia')
      .update({ puntos_otorgados: valorPuntos })
      .eq('id', record.id)

    if (updateError) {
      throw new Error(`Error cerrando puntos_otorgados: ${updateError.message}`)
    }

    // 4. Badge "Primera clase" — solo aplica a tipo_clase='ajedrez'
    let badgePrimeraClase = false
    if (record.tipo_clase === 'ajedrez') {
      const result = await otorgarBadgePrimeraClase(
        supabase,
        record.id_alumno,
        idTemporada,
      )
      badgePrimeraClase = result.otorgado
    }

    return jsonResponse({
      ok: true,
      asistencia_id: record.id,
      puntos_sumados: valorPuntos,
      tipo_clase: record.tipo_clase,
      modulo: nombreModulo ?? 'sin módulo',
      badge_primera_clase: badgePrimeraClase,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Error procesando webhook calcular_puntos_asistencia:', msg)
    return jsonResponse({ ok: false, error: msg }, 500)
  }
})
