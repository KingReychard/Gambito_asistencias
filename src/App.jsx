import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Gamepad2,
  Trophy,
  ClipboardList
} from 'lucide-react'

// =============================================================================
// CONFIGURACIÓN - URLs REALES
// =============================================================================
const CONFIG = {
  DATA_URL: 'https://primary-production-d866f.up.railway.app/webhook/obtener-datos-clase',
  WEBHOOK_URL: 'https://primary-production-d866f.up.railway.app/webhook/registrar-clase',
  ACCESS_PIN: '',
}

// =============================================================================
// COMPONENTES UI
// =============================================================================

function Header() {
  return (
    <header className="bg-gambito-green text-white px-4 py-3 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <span className="text-3xl">♞</span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">GAMBITO</h1>
          <p className="text-xs text-white/80 -mt-0.5">Registro de Clases</p>
        </div>
      </div>
    </header>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

function Button({ children, onClick, variant = 'primary', disabled = false, loading = false, className = '' }) {
  const baseStyles = 'flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
  
  const variants = {
    primary: 'bg-gambito-green hover:bg-gambito-green-dark text-white shadow-md shadow-gambito-green/20',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gambito-dark',
    outline: 'bg-transparent border-2 border-gambito-green text-gambito-green hover:bg-gambito-green/5',
  }
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  )
}

function Select({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gambito-gray">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gambito-gray">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gambito-dark font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gambito-green/30 focus:border-gambito-green transition-all`}
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gambito-gray">
          <ChevronRight className="w-5 h-5 rotate-90" />
        </div>
      </div>
    </div>
  )
}

function NumberInput({ label, value, onChange, min = 1, max = 10 }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gambito-gray">{label}</label>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gambito-dark transition-colors"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-gambito-dark">{value}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gambito-dark transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

function RadioGroup({ label, value, onChange, options }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gambito-gray">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              value === opt.value
                ? 'border-gambito-green bg-gambito-green/5 text-gambito-green'
                : 'border-gray-200 bg-white text-gambito-dark hover:border-gray-300'
            }`}
          >
            {opt.icon}
            <span className="font-medium text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AlumnoItem({ alumno, asistio, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
        asistio
          ? 'border-gambito-green/30 bg-gambito-green/5'
          : 'border-gambito-red/30 bg-gambito-red/5'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        asistio ? 'bg-gambito-green text-white' : 'bg-gambito-red text-white'
      }`}>
        {asistio ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </div>
      <span className={`flex-1 text-left font-medium ${asistio ? 'text-gambito-dark' : 'text-gambito-red'}`}>
        {alumno.nombre}
      </span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        asistio ? 'bg-gambito-green/20 text-gambito-green-dark' : 'bg-gambito-red/20 text-gambito-red'
      }`}>
        {asistio ? 'Presente' : 'Falta'}
      </span>
    </button>
  )
}

// =============================================================================
// PANTALLAS
// =============================================================================

function PantallaConfiguracion({ onNext, formData, setFormData, data }) {
  const { maestros, grupos, temas } = data
  
  // Filtrar grupos según el día actual y el maestro
  const hoy = new Date().getDay()
  const esLunesMiercoles = hoy === 1 || hoy === 3
  const esMartesJueves = hoy === 2 || hoy === 4
  
  const gruposFiltrados = grupos.filter(g => {
    if (formData.maestroId && g.maestroId !== formData.maestroId) return false
    if (esLunesMiercoles && g.dias !== 'Lun y Mie') return false
    if (esMartesJueves && g.dias !== 'Mar y Jue') return false
    return true
  })
  
  // Obtener temas del nivel del grupo seleccionado
  const grupoSeleccionado = grupos.find(g => g.id === formData.grupoId)
  const temasDelNivel = grupoSeleccionado 
    ? temas.filter(t => t.nivel === grupoSeleccionado.nivel)
    : []
  
  const tiposClase = [
    { value: 'Temario', label: 'Temario', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'Práctica', label: 'Práctica', icon: <Gamepad2 className="w-4 h-4" /> },
    { value: 'Evaluación', label: 'Evaluación', icon: <ClipboardList className="w-4 h-4" /> },
    { value: 'Torneo', label: 'Torneo', icon: <Trophy className="w-4 h-4" /> },
  ]
  
  const canContinue = formData.grupoId && formData.tipo && 
    (formData.tipo !== 'Temario' || (formData.temaId && formData.sesion && formData.totalSesiones))
  
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Fecha */}
      <Card className="p-4">
        <div className="flex items-center gap-3 text-gambito-dark">
          <Calendar className="w-5 h-5 text-gambito-green" />
          <div>
            <p className="text-sm text-gambito-gray">Fecha de la clase</p>
            <p className="font-semibold">
              {new Date().toLocaleDateString('es-MX', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Maestro */}
      <Card className="p-4">
        <Select
          label="Maestro"
          value={formData.maestroId}
          onChange={(v) => setFormData({ ...formData, maestroId: v, grupoId: '' })}
          options={maestros.map(m => ({ value: m.id, label: m.nombre }))}
          icon={GraduationCap}
        />
      </Card>
      
      {/* Grupo */}
      <Card className="p-4">
        <Select
          label="Grupo"
          value={formData.grupoId}
          onChange={(v) => setFormData({ ...formData, grupoId: v })}
          options={gruposFiltrados.map(g => ({ 
            value: g.id, 
            label: `${g.codigo} (${g.dias} ${g.horario})` 
          }))}
          icon={Users}
        />
        {grupoSeleccionado && (
          <p className="mt-2 text-sm text-gambito-gray">
            Nivel: {grupoSeleccionado.nivel}
          </p>
        )}
      </Card>
      
      {/* Tipo de clase */}
      <Card className="p-4">
        <RadioGroup
          label="Tipo de clase"
          value={formData.tipo}
          onChange={(v) => setFormData({ ...formData, tipo: v, temaId: '', sesion: 1, totalSesiones: 2 })}
          options={tiposClase}
        />
      </Card>
      
      {/* Tema y sesión (solo si es Temario) */}
      {formData.tipo === 'Temario' && (
        <Card className="p-4 space-y-4">
          <Select
            label="Tema"
            value={formData.temaId}
            onChange={(v) => setFormData({ ...formData, temaId: v })}
            options={temasDelNivel.map(t => ({ value: t.id, label: t.nombre }))}
            icon={BookOpen}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Sesión #"
              value={formData.sesion}
              onChange={(v) => setFormData({ ...formData, sesion: v })}
              min={1}
              max={formData.totalSesiones}
            />
            <NumberInput
              label="de total"
              value={formData.totalSesiones}
              onChange={(v) => setFormData({ ...formData, totalSesiones: v, sesion: Math.min(formData.sesion, v) })}
              min={1}
              max={5}
            />
          </div>
          
          {/* Indicador visual de sesiones */}
          <div className="flex gap-1.5 pt-2">
            {Array.from({ length: formData.totalSesiones }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i < formData.sesion ? 'bg-gambito-green' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gambito-gray">
            {formData.sesion === formData.totalSesiones 
              ? '✓ Última sesión - Se marcará como completado'
              : `Sesión ${formData.sesion} de ${formData.totalSesiones}`
            }
          </p>
        </Card>
      )}
      
      {/* Botón continuar */}
      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full"
      >
        Pasar asistencia
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}

function PantallaAsistencia({ onBack, onSubmit, formData, asistencia, setAsistencia, loading, data }) {
  const { grupos, alumnos } = data
  const grupo = grupos.find(g => g.id === formData.grupoId)
  const alumnosDelGrupo = alumnos.filter(a => a.grupoId === formData.grupoId)
  
  const asistieron = Object.values(asistencia).filter(Boolean).length
  const faltaron = alumnosDelGrupo.length - asistieron
  
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header con resumen */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 text-gambito-gray hover:text-gambito-dark">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gambito-dark">{grupo?.codigo}</p>
            <p className="text-sm text-gambito-gray">
              {formData.tipo === 'Temario' 
                ? data.temas.find(t => t.id === formData.temaId)?.nombre
                : formData.tipo
              }
            </p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </Card>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gambito-green">{asistieron}</p>
          <p className="text-xs text-gambito-gray">Presentes</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gambito-red">{faltaron}</p>
          <p className="text-xs text-gambito-gray">Faltas</p>
        </Card>
      </div>
      
      {/* Instrucción */}
      <p className="text-center text-sm text-gambito-gray">
        Toca un alumno para cambiar su estado
      </p>
      
      {/* Lista de alumnos */}
      <div className="space-y-2 stagger-children">
        {alumnosDelGrupo.map(alumno => (
          <AlumnoItem
            key={alumno.id}
            alumno={alumno}
            asistio={asistencia[alumno.id] !== false}
            onToggle={() => setAsistencia(prev => ({
              ...prev,
              [alumno.id]: prev[alumno.id] === false ? true : false
            }))}
          />
        ))}
      </div>
      
      {/* Notas */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gambito-gray mb-2">
          Notas (opcional)
        </label>
        <textarea
          value={formData.notas || ''}
          onChange={(e) => formData.setNotas?.(e.target.value)}
          placeholder="Observaciones de la clase..."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gambito-dark resize-none focus:outline-none focus:ring-2 focus:ring-gambito-green/30 focus:border-gambito-green"
          rows={2}
        />
      </Card>
      
      {/* Botón guardar */}
      <Button
        onClick={onSubmit}
        loading={loading}
        className="w-full animate-pulse-green"
      >
        <Check className="w-5 h-5" />
        Guardar Clase
      </Button>
    </div>
  )
}

function PantallaExito({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-gambito-green/10 flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-gambito-green" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gambito-dark">¡Clase registrada!</h2>
        <p className="text-gambito-gray mt-2">La asistencia se guardó correctamente</p>
      </div>
      <Button onClick={onReset} variant="outline">
        Registrar otra clase
      </Button>
    </div>
  )
}

function PantallaError({ mensaje, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-gambito-red/10 flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-gambito-red" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gambito-dark">Error</h2>
        <p className="text-gambito-gray mt-2">{mensaje}</p>
      </div>
      <Button onClick={onRetry} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  )
}

function PantallaCargando() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <Loader2 className="w-16 h-16 text-gambito-green animate-spin" />
      <p className="text-gambito-gray">Cargando datos de Notion...</p>
    </div>
  )
}

// =============================================================================
// APP PRINCIPAL
// =============================================================================

export default function App() {
  const [pantalla, setPantalla] = useState('cargando') // cargando, config, asistencia, exito, error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notas, setNotas] = useState('')
  const [data, setData] = useState(null)
  
  const [formData, setFormData] = useState({
    maestroId: localStorage.getItem('gambito_maestro') || '',
    grupoId: '',
    tipo: '',
    temaId: '',
    sesion: 1,
    totalSesiones: 2,
  })
  
  const [asistencia, setAsistencia] = useState({})
  
  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos()
  }, [])
  
  const cargarDatos = async () => {
    try {
      const response = await fetch(CONFIG.DATA_URL)
      if (!response.ok) throw new Error('Error al cargar datos')
      const datos = await response.json()
      setData(datos)
      setPantalla('config')
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('No se pudieron cargar los datos de Notion. Verifica que n8n esté funcionando.')
      setPantalla('error')
    }
  }
  
  // Guardar maestro en localStorage
  useEffect(() => {
    if (formData.maestroId) {
      localStorage.setItem('gambito_maestro', formData.maestroId)
    }
  }, [formData.maestroId])
  
  // Inicializar asistencia cuando cambia el grupo
  useEffect(() => {
    if (formData.grupoId && data) {
      const alumnosDelGrupo = data.alumnos.filter(a => a.grupoId === formData.grupoId)
      const inicial = {}
      alumnosDelGrupo.forEach(alumno => {
        inicial[alumno.id] = true // Todos presentes por default
      })
      setAsistencia(inicial)
    }
  }, [formData.grupoId, data])
  
  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const grupo = data.grupos.find(g => g.id === formData.grupoId)
      const tema = formData.tipo === 'Temario' 
        ? data.temas.find(t => t.id === formData.temaId)
        : null
      
      const payload = {
        fecha: new Date().toISOString().split('T')[0],
        maestroId: formData.maestroId,
        grupoId: formData.grupoId,
        grupoCodigo: grupo?.codigo,
        tipo: formData.tipo,
        temaId: formData.temaId,
        temaNombre: tema?.nombre,
        sesion: formData.tipo === 'Temario' ? formData.sesion : null,
        totalSesiones: formData.tipo === 'Temario' ? formData.totalSesiones : null,
        temaCompletado: formData.tipo === 'Temario' && formData.sesion === formData.totalSesiones,
        notas: notas,
        asistencia: Object.entries(asistencia).map(([alumnoId, asistio]) => ({
          alumnoId,
          alumnoNombre: data.alumnos.find(a => a.id === alumnoId)?.nombre,
          status: asistio ? 'Asistió' : 'Falta'
        }))
      }
      
      const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error('Error al guardar')
      
      setPantalla('exito')
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'Error desconocido al guardar la clase')
      setPantalla('error')
    } finally {
      setLoading(false)
    }
  }
  
  const handleReset = () => {
    setFormData(prev => ({
      ...prev,
      grupoId: '',
      tipo: '',
      temaId: '',
      sesion: 1,
      totalSesiones: 2,
    }))
    setAsistencia({})
    setNotas('')
    setPantalla('config')
  }
  
  if (!data && pantalla === 'cargando') {
    return (
      <div className="min-h-screen bg-gambito-light">
        <Header />
        <main className="max-w-lg mx-auto p-4 pb-8">
          <PantallaCargando />
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gambito-light">
      <Header />
      
      <main className="max-w-lg mx-auto p-4 pb-8">
        {pantalla === 'config' && data && (
          <PantallaConfiguracion
            onNext={() => setPantalla('asistencia')}
            formData={formData}
            setFormData={setFormData}
            data={data}
          />
        )}
        
        {pantalla === 'asistencia' && data && (
          <PantallaAsistencia
            onBack={() => setPantalla('config')}
            onSubmit={handleSubmit}
            formData={{ ...formData, notas, setNotas }}
            asistencia={asistencia}
            setAsistencia={setAsistencia}
            loading={loading}
            data={data}
          />
        )}
        
        {pantalla === 'exito' && (
          <PantallaExito onReset={handleReset} />
        )}
        
        {pantalla === 'error' && (
          <PantallaError 
            mensaje={error} 
            onRetry={() => {
              if (error.includes('cargar datos')) {
                cargarDatos()
              } else {
                handleReset()
              }
            }} 
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t border-gray-100 py-2 text-center">
        <p className="text-xs text-gambito-gray">
          Gambito © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
