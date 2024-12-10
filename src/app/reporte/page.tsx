'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import supabase from '../../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Users, CreditCard, Home } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

function Header() {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-lg shadow-lg mb-8 mx-auto max-w-7xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full p-1">
            <Image
              src="/Imagen1.png" 
              alt="Angeles Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
          <h1 className="text-xl font-bold text-white">Angeles - Informes de Negocio</h1>
        </div>
        <div className="flex items-center space-x-4">
        <Link href="/jefe" className="text-white hover:text-gray-200 transition-colors flex items-center space-x-2">
          <Home size={24} />
          <span className="hidden sm:inline">Volver al Menú</span>
        </Link>
        </div>
      </div>
    </header>
  )
}

type Venta = {
  id: number
  price: number
  worker_id: string | null
  worker_id_integer: number | null
  servicio_id: string
  fecha_transaccion: string
}

type Abono = {
  id: number
  ventas_id_venta: number
  cantidad_abonada: number
  fecha_abono: string
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

type Servicio = {
  id: number
  name_servicio: string
}

type FiltroTiempo = '24h' | 'semana' | 'mes' | 'todo'

export default function InformesNegocio() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [abonos, setAbonos] = useState<Abono[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('todo')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single()

      if (userError || !userData) {
        setError('Error al verificar los permisos de usuario.')
        return
      }

      if (userData.role !== 'admin') {
        router.push('/autorizacion')
        return
      }

      setIsAuthenticated(true)
      setIsAdmin(true)
      obtenerDatos()
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const ahora = new Date()
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
    console.log(`Filtrando datos desde ${hace24Horas.toISOString()} hasta ${ahora.toISOString()}`)
  }, [filtroTiempo])

  const obtenerDatos = async () => {
    try {
      setCargando(true)
      const { data: datosVentas, error: errorVentas } = await supabase
        .from('ventas')
        .select('*')
        .order('fecha_transaccion', { ascending: false })
      if (errorVentas) throw errorVentas

      const { data: datosAbonos, error: errorAbonos } = await supabase
        .from('abono')
        .select('*')
        .order('fecha_abono', { ascending: true })
      if (errorAbonos) throw errorAbonos

      const { data: datosCitas, error: errorCitas } = await supabase
        .from('citas')
        .select('*')
      if (errorCitas) throw errorCitas

      const { data: datosTrabajadores, error: errorTrabajadores } = await supabase
        .from('users')
        .select('id, name')
      if (errorTrabajadores) throw errorTrabajadores

      const { data: datosServicios, error: errorServicios } = await supabase
        .from('servicios')
        .select('id, name_servicio')
      if (errorServicios) throw errorServicios

      setVentas(datosVentas)
      setAbonos(datosAbonos)
      setCitas(datosCitas)
      setTrabajadores(datosTrabajadores)
      setServicios(datosServicios)
    } catch (err) {
      setError('Error al obtener los datos. Por favor, inténtelo de nuevo más tarde.')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const filtrarPorTiempo = (fecha: string) => {
    const ahora = new Date()
    const fechaComparar = new Date(fecha)
    const diferenciaTiempo = ahora.getTime() - fechaComparar.getTime()
    const diferenciaHoras = diferenciaTiempo / (1000 * 3600)

    switch (filtroTiempo) {
      case '24h':
        return diferenciaHoras <= 24
      case 'semana':
        return diferenciaTiempo <= 7 * 24 * 60 * 60 * 1000
      case 'mes':
        return diferenciaTiempo <= 30 * 24 * 60 * 60 * 1000
      default:
        return true
    }
  }

  const ventasFiltradas = useMemo(() => {
    const filtradas = ventas.filter(venta => {
      const cumpleFiltro = venta.worker_id_integer !== null && filtrarPorTiempo(venta.fecha_transaccion)
      if (filtroTiempo === '24h') {
        console.log(`Venta: ${venta.id}, Fecha: ${venta.fecha_transaccion}, Incluida: ${cumpleFiltro}`)
      }
      return cumpleFiltro
    })
    console.log(`Total ventas filtradas: ${filtradas.length}`)
    return filtradas
  }, [ventas, filtroTiempo])

  const abonosFiltrados = useMemo(() => {
    const filtrados = abonos.filter(abono => {
      const cumpleFiltro = filtrarPorTiempo(abono.fecha_abono)
      if (filtroTiempo === '24h') {
        console.log(`Abono: ${abono.id}, Fecha: ${abono.fecha_abono}, Incluido: ${cumpleFiltro}`)
      }
      return cumpleFiltro
    })
    console.log(`Total abonos filtrados: ${filtrados.length}`)
    return filtrados
  }, [abonos, filtroTiempo])

  const citasFiltradas = useMemo(() => 
    citas.filter(cita => filtrarPorTiempo(cita.service_date) && ventas.find(venta => venta.id === cita.venta_id)),
    [citas, ventas, filtroTiempo]
  )

  const ventasTotales = useMemo(() => Math.round(ventasFiltradas.reduce((sum, venta) => sum + venta.price, 0)), [ventasFiltradas])
  const abonosTotales = useMemo(() => Math.round(abonosFiltrados.reduce((sum, abono) => sum + abono.cantidad_abonada, 0)), [abonosFiltrados])
  const valorPromedioVenta = useMemo(() => ventasFiltradas.length > 0 ? Math.round(ventasTotales / ventasFiltradas.length) : 0, [ventasFiltradas, ventasTotales])
  const porcentajeAbonado = useMemo(() => ventasTotales > 0 ? Math.round((abonosTotales / ventasTotales) * 100) : 0, [abonosTotales, ventasTotales])

  const ventasYAbonosMensuales = useMemo(() => {
    const datos: Record<string, { ventas: number, abonos: number }> = {}
    citasFiltradas.forEach(cita => {
      const venta = ventas.find(v => v.id === cita.venta_id)
      if (venta) {
        const fecha = new Date(cita.service_date)
        const mesAno = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`
        if (!datos[mesAno]) datos[mesAno] = { ventas: 0, abonos: 0 }
        datos[mesAno].ventas += Math.round(venta.price)
      }
    })
    abonosFiltrados.forEach(abono => {
      const fecha = new Date(abono.fecha_abono)
      const mesAno = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`
      if (!datos[mesAno]) datos[mesAno] = { ventas: 0, abonos: 0 }
      datos[mesAno].abonos += Math.round(abono.cantidad_abonada)
    })
    return datos
  }, [ventas, abonosFiltrados, citasFiltradas])

  const ventasPorTrabajador = useMemo(() => {
    return ventasFiltradas.reduce((acc, venta) => {
      const workerId = venta.worker_id_integer?.toString() || 'Sin asignar'
      acc[workerId] = Math.round((acc[workerId] || 0) + venta.price)
      return acc
    }, {} as Record<string, number>)
  }, [ventasFiltradas])

  const trabajadoresMap = useMemo(() => new Map(trabajadores.map(t => [t.id.toString(), t.name])), [trabajadores])

  const datosGraficoBarras = useMemo(() => ({
    labels: Object.keys(ventasYAbonosMensuales),
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: Object.values(ventasYAbonosMensuales).map(d => d.ventas),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Abonos Mensuales',
        data: Object.values(ventasYAbonosMensuales).map(d => d.abonos),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  }), [ventasYAbonosMensuales])

  const datosGraficoLineas = useMemo(() => {
    const abonosDiarios: Record<string, number> = {}
    abonosFiltrados.forEach(abono => {
      const fecha = new Date(abono.fecha_abono).toISOString().split('T')[0]
      abonosDiarios[fecha] = Math.round((abonosDiarios[fecha] || 0) + abono.cantidad_abonada)
    })
    const fechasOrdenadas = Object.keys(abonosDiarios).sort()
    return {
      labels: fechasOrdenadas,
      datasets: [
        {
          label: 'Abonos Diarios',
          data: fechasOrdenadas.map(fecha => abonosDiarios[fecha]),
          fill: false,
          borderColor: 'rgb(16, 185, 129)',
          tension: 0.1,
        },
      ],
    }
  }, [abonosFiltrados])

  const datosGraficoCircular = useMemo(() => {
    const labels: string[] = []
    const data: number[] = []

    Object.entries(ventasPorTrabajador).forEach(([id, ventas]) => {
      const nombre = id === 'Sin asignar' 
        ? 'Trabajador Sin asignar' 
        : trabajadoresMap.get(id) || `Trabajador ${id.substring(0, 8)}...`
      labels.push(nombre)
      data.push(Math.round(ventas))
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

  const datosGraficoBarrasApiladas = useMemo(() => {
    const labels = Object.keys(ventasYAbonosMensuales)
    const ventasTotales = Object.values(ventasYAbonosMensuales).map(d => d.ventas)
    const abonosTotales = Object.values(ventasYAbonosMensuales).map(d => d.abonos)
    const pendientes = ventasTotales.map((venta, index) => Math.max(0, venta - abonosTotales[index]))

    return {
      labels,
      datasets: [
        {
          label: 'Abonado',
          data: abonosTotales,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: 'Pendiente',
          data: pendientes,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    }
  }, [ventasYAbonosMensuales])

  const serviciosMasUsados = useMemo(() => {
    const conteoServicios: Record<string, number> = {}
    ventasFiltradas.forEach(venta => {
      const servicio = servicios.find(s => s.id === parseInt(venta.servicio_id))
      if (servicio) {
        conteoServicios[servicio.name_servicio] = (conteoServicios[servicio.name_servicio] || 0) + 1
      }
    })
    return Object.entries(conteoServicios)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [ventasFiltradas, servicios])

  const datosGraficoServiciosMasUsados = useMemo(() => ({
    labels: serviciosMasUsados.map(([nombre]) => nombre),
    datasets: [
      {
        label: 'Servicios Más Usados',
        data: serviciosMasUsados.map(([, count]) => count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }), [serviciosMasUsados])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'white',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
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

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Header />
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Dashboard de Informes de Negocio</h1>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-end">
          <select
            value={filtroTiempo}
            onChange={(e) => setFiltroTiempo(e.target.value as FiltroTiempo)}
            className="block w-full md:w-auto px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-gray-700 appearance-none cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.5rem center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `1.5em 1.5em`,
              paddingRight: `2.5rem`
            }}
          >
            <option value="24h">Últimas 24 horas</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
            <option value="todo">Todo</option>
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <motion.div className="bg-white shadow-md rounded-lg p-4" whileHover={{ scale: 1.03 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-2">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Ventas</dt>
                  <dd className="text-lg font-semibold text-gray-900">${ventasTotales}</dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white shadow-md rounded-lg p-4" whileHover={{ scale: 1.03 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Abonos</dt>
                  <dd className="text-lg font-semibold text-gray-900">${abonosTotales}</dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white shadow-md rounded-lg p-4" whileHover={{ scale: 1.03 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Promedio Venta</dt>
                  <dd className="text-lg font-semibold text-gray-900">${valorPromedioVenta}</dd>
                </dl>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white shadow-md rounded-lg p-4" whileHover={{ scale: 1.03 }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-2">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Trabajadores</dt>
                  <dd className="text-lg font-semibold text-gray-900">{trabajadores.length}</dd>
                </dl>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div 
            className="bg-white shadow-md rounded-lg p-4"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <h2 className="text-lg font-semibold mb-2">Ventas y Abonos Mensuales</h2>
            <div className="h-64">
              <Bar data={datosGraficoBarras} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white shadow-md rounded-lg p-4"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <h2 className="text-lg font-semibold mb-2">Abonos Diarios</h2>
            <div className="h-64">
              <Line data={datosGraficoLineas} options={chartOptions} />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div 
            className="bg-white shadow-md rounded-lg p-4"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <h2 className="text-lg font-semibold mb-2">Ventas por Trabajador</h2>
            <div className="h-64">
              <Pie data={datosGraficoCircular} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white shadow-md rounded-lg p-4"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <h2 className="text-lg font-semibold mb-2">Estado de Pagos Mensuales</h2>
            <div className="h-64">
              <Bar data={datosGraficoBarrasApiladas} options={chartOptions} />
            </div>
            <div className="mt-2 text-center">
              <p className="text-lg font-semibold">{porcentajeAbonado}% del total ha sido abonado</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            className="bg-white shadow-md rounded-lg p-4"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <h2 className="text-lg font-semibold mb-2">Servicios Más Usados</h2>
            <div className="h-64">
              <Bar data={datosGraficoServiciosMasUsados} options={chartOptions} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

