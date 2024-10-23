'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import supabase from '../../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react'

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

export default function Finanzas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">Análisis Financiero</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white overflow-hidden shadow-lg rounded-xl"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-600 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">${ventasTotales.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white overflow-hidden shadow-lg rounded-xl"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-600 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Promedio de Venta</p>
                  <p className="text-2xl font-bold text-gray-900">${valorPromedioVenta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white overflow-hidden shadow-lg rounded-xl"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-600 rounded-md p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Número de Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{ventasFiltradas.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white overflow-hidden shadow-lg rounded-xl"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-600 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Citas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{citasFiltradas.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ventas Mensuales</h2>
            <Bar data={datosGraficoBarras} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (context) => `${context.label}: $${context.raw}` } }
              }
            }} />
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ventas Diarias</h2>
            <Line data={datosGraficoLineas} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (context) => `Fecha: ${context.label}, Venta: $${context.raw}` } }
              }
            }} />
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Distribución de Ventas por Trabajador</h2>
            <Pie data={datosGraficoCircular} options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: (context) => `${context.label}: $${context.raw}` } }
              }
            }} />
          </div>
        </div>

        <div className="mt-12 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información de Depuración</h2>
          <pre className="bg-white p-4 rounded-lg">{error}</pre>
        </div>
      </div>
    </div>
  )
}
