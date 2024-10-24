'use client'
import { useState, useEffect, useMemo } from 'react'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import supabase from '../../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react'
import Image from 'next/image'

function Header() {
  return (
    <header className="bg-purple-600 p-4 rounded-2xl shadow-lg mb-8 mx-auto max-w-7xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full p-1">
            <Image
              src="/Imagen1.png" 
              alt="Angeles Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Angeles</h1>
        </div>
        <button className="text-white">
          <Calendar size={24} />
        </button>
      </div>
    </header>
  )
}

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

type Venta = {
  id: number
  price: number
  worker_id: string | null
  worker_id_integer: number | null
}

type Cita = {
  id: number
  service_date: string
  venta_id: number
}

type Trabajador = {
  id: number
  name: string
}

export default function InformesNegocio() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        // Obtener ventas
        const { data: datosVentas, error: errorVentas } = await supabase
          .from('ventas')
          .select('*')
          .order('id', { ascending: true })

        if (errorVentas) throw errorVentas

        // Obtener citas
        const { data: datosCitas, error: errorCitas } = await supabase
          .from('citas')
          .select('*')

        if (errorCitas) throw errorCitas

        // Obtener trabajadores
        const { data: datosTrabajadores, error: errorTrabajadores } = await supabase
          .from('users')
          .select('id, name')

        if (errorTrabajadores) throw errorTrabajadores

        setVentas(datosVentas)
        setCitas(datosCitas)
        setTrabajadores(datosTrabajadores)

        setDebugInfo(`Ventas: ${JSON.stringify(datosVentas)}\nCitas: ${JSON.stringify(datosCitas)}\nTrabajadores: ${JSON.stringify(datosTrabajadores)}`)
      } catch (err) {
        setError('Error al obtener los datos. Por favor, inténtelo de nuevo más tarde.')
        console.error(err)
      } finally {
        setCargando(false)
      }
    }

    obtenerDatos()
  }, [])

  const ventasFiltradas = useMemo(() => ventas.filter(venta => venta.worker_id_integer !== null), [ventas])
  const citasFiltradas = useMemo(() => citas.filter(cita => ventas.find(venta => venta.id === cita.venta_id)), [ventas, citas])
  
  const ventasTotales = useMemo(() => ventasFiltradas.reduce((sum, venta) => sum + venta.price, 0), [ventasFiltradas])
  const valorPromedioVenta = useMemo(() => ventasFiltradas.length > 0 ? ventasTotales / ventasFiltradas.length : 0, [ventasFiltradas, ventasTotales])

  const ventasMensuales = useMemo(() => {
    return citasFiltradas.reduce((acc, cita) => {
      const venta = ventas.find(venta => venta.id === cita.venta_id)
      if (venta) {
        const fecha = new Date(cita.service_date)
        const mesAno = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`
        acc[mesAno] = (acc[mesAno] || 0) + venta.price
      }
      return acc
    }, {} as Record<string, number>)
  }, [ventas, citasFiltradas])

  const ventasPorTrabajador = useMemo(() => {
    return ventasFiltradas.reduce((acc, venta) => {
      const workerId = venta.worker_id_integer?.toString() || 'Sin asignar'
      acc[workerId] = (acc[workerId] || 0) + venta.price
      return acc
    }, {} as Record<string, number>)
  }, [ventasFiltradas])

  const trabajadoresMap = useMemo(() => new Map(trabajadores.map(t => [t.id.toString(), t.name])), [trabajadores])

  const datosGraficoBarras = useMemo(() => ({
    labels: Object.keys(ventasMensuales),
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: Object.values(ventasMensuales),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }), [ventasMensuales])

  const datosGraficoLineas = useMemo(() => ({
    labels: ventasFiltradas.map(venta => {
      const cita = citas.find(cita => cita.venta_id === venta.id)
      return cita ? new Date(cita.service_date).toLocaleDateString() : ''
    }),
    datasets: [
      {
        label: 'Ventas Diarias',
        data: ventasFiltradas.map(venta => venta.price),
        fill: false,
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.1,
      },
    ],
  }), [ventasFiltradas, citas])

  const datosGraficoCircular = useMemo(() => {
    const labels: string[] = []
    const data: number[] = []

    Object.entries(ventasPorTrabajador).forEach(([id, ventas]) => {
      const nombre = id === 'Sin asignar' 
        ? 'Trabajador Sin asignar' 
        : trabajadoresMap.get(id) || `Trabajador ${id.substring(0, 8)}...`
      labels.push(nombre)
      data.push(ventas)
    })

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(239, 68, 68, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(139, 92, 246, 0.6)',
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(139, 92, 246, 1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }, [ventasPorTrabajador, trabajadoresMap])

  useEffect(() => {
    setDebugInfo(prevInfo => 
      `${prevInfo}\nVentas por Trabajador: ${JSON.stringify(ventasPorTrabajador)}\nDatos Gráfico Circular: ${JSON.stringify(datosGraficoCircular)}`
    )
  }, [ventasPorTrabajador, datosGraficoCircular])

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Header />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Informes de Negocio</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div className="bg-white shadow-lg rounded-xl p-6" whileHover={{ scale: 1.05 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-600 rounded-md p-3">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Ventas</dt>
                  <dd>
                    <div className="text-lg font-bold text-gray-900">${ventasTotales.toFixed(2)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white shadow-lg rounded-xl p-6" whileHover={{ scale: 1.05 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-600 rounded-md p-3">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Valor Promedio Venta</dt>
                  <dd>
                    <div className="text-lg font-bold text-gray-900">${valorPromedioVenta.toFixed(2)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white shadow-lg rounded-xl p-6" whileHover={{ scale: 1.05 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-600 rounded-md p-3">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Trabajadores Activos</dt>
                  <dd>
                    <div className="text-lg font-bold text-gray-900">{trabajadores.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white shadow-lg rounded-xl p-6" whileHover={{ scale: 1.05 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-600 rounded-md p-3">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Citas Registradas</dt>
                  <dd>
                    <div className="text-lg font-bold text-gray-900">{citas.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Ventas Mensuales</h2>
            <Bar data={datosGraficoBarras} options={{ responsive: true }} />
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Ventas Diarias</h2>
            <Line data={datosGraficoLineas} options={{ responsive: true }} />
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Distribución de Ventas por Trabajador</h2>
          <Pie data={datosGraficoCircular} options={{ responsive: true }} />
        </div>

        {debugInfo && (
          <pre className="mt-8 p-4 bg-gray-200 rounded-md">
            <h3 className="font-bold">Información de Depuración:</h3>
            <code>{debugInfo}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
