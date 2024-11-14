'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import supabase from "../../../lib/supabaseClient"
import { motion } from 'framer-motion'
import { Edit, Trash2, ChevronDown, ChevronUp, Home } from 'lucide-react'

type Abono = {
  id: number
  cantidad_abonada: number
  fecha_abono: string
}

type Comision = {
  id_comision: number
  ventas_id_venta: number
  empleado_id_empleado: number
  monto_comision: number
  fecha_comision: string
  empleado_name?: string
  venta_total?: number
  tipo_pago?: string
  porcentaje_comision?: number
}

type VentaAgrupada = {
  ventas_id_venta: number
  venta_total: number
  tipo_pago: string
  porcentaje_comision: number
  empleado_name: string
  comisiones: Comision[]
  abonos: Abono[]
}

type User = {
  id: number
  name: string
}

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-2xl"
    >
      <div className="flex items-center space-x-4">
        <Image
          src="/imagen1.png" 
          alt="Logo de Angeles"
          width={50}
          height={50}
          className="rounded-full border-2 border-white shadow-md"
        />
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold tracking-wide"
        >
          Angeles
        </motion.span>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/jefe" className="text-white hover:text-gray-200 transition-colors flex items-center space-x-2">
          <Home size={24} />
          <span className="hidden sm:inline">Volver al Menú</span>
        </Link>
      </div>
    </motion.header>
  )
}

export default function ComisionesTable() {
  const [ventasAgrupadas, setVentasAgrupadas] = useState<VentaAgrupada[]>([])
  const [filteredVentas, setFilteredVentas] = useState<VentaAgrupada[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<number[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<number | ''>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !userData || userData.role !== 'admin') {
      router.push('/autorizacion')
      return
    }

    setIsAuthenticated(true)
    setIsAdmin(true)
    fetchComisiones()
    fetchUsers()
  }, [router])

  const fetchComisiones = async () => {
    try {
      const { data, error } = await supabase
        .from('comision')
        .select(`
          *,
          empleado:empleado_id_empleado(name),
          venta:ventas_id_venta(
            id,
            price,
            tipo_pago(name_comision, porcentaje),
            abono(id, cantidad_abonada, fecha_abono)
          )
        `)
        .order('fecha_comision', { ascending: false })

      if (error) throw error

      if (data) {
        const ventasMap = new Map<number, VentaAgrupada>()

        data.forEach((comision) => {
          const ventaId = comision.ventas_id_venta
          if (!ventasMap.has(ventaId)) {
            ventasMap.set(ventaId, {
              ventas_id_venta: ventaId,
              venta_total: comision.venta?.price || 0,
              tipo_pago: comision.venta?.tipo_pago?.name_comision || '',
              porcentaje_comision: comision.venta?.tipo_pago?.porcentaje || 0,
              empleado_name: comision.empleado?.name || '',
              comisiones: [],
              abonos: comision.venta?.abono || []
            })
          }

          ventasMap.get(ventaId)!.comisiones.push({
            id_comision: comision.id_comision,
            ventas_id_venta: comision.ventas_id_venta,
            empleado_id_empleado: comision.empleado_id_empleado,
            monto_comision: comision.monto_comision,
            fecha_comision: comision.fecha_comision,
            empleado_name: comision.empleado?.name,
            venta_total: comision.venta?.price,
            tipo_pago: comision.venta?.tipo_pago?.name_comision,
            porcentaje_comision: comision.venta?.tipo_pago?.porcentaje,
          })
        })

        const ventasAgrupadas = Array.from(ventasMap.values())
        setVentasAgrupadas(ventasAgrupadas)
        setFilteredVentas(ventasAgrupadas)
      }
    } catch (error) {
      console.error('Error al obtener las comisiones:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error)
    }
  }

  const filterVentas = useCallback(() => {
    let filtered = [...ventasAgrupadas]

    if (selectedUser) {
      filtered = filtered.filter(venta => venta.comisiones.some(comision => comision.empleado_id_empleado === selectedUser))
    }

    if (selectedMonth) {
      filtered = filtered.filter(venta => {
        const ventaDate = new Date(venta.comisiones[0].fecha_comision)
        return ventaDate.getMonth() === parseInt(selectedMonth) - 1 // Months are 0-indexed
      })
    }

    setFilteredVentas(filtered)
  }, [ventasAgrupadas, selectedUser, selectedMonth])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    filterVentas()
  }, [filterVentas])

  const handleEdit = (id: number) => {
    // Implementar lógica para editar comisión
    console.log('Editar comisión:', id)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta comisión?')) {
      try {
        const { error } = await supabase
          .from('comision')
          .delete()
          .eq('id_comision', id)

        if (error) throw error

        // Actualizar el estado después de eliminar
        setVentasAgrupadas(prevVentas => 
          prevVentas.map(venta => ({
            ...venta,
            comisiones: venta.comisiones.filter(comision => comision.id_comision !== id)
          })).filter(venta => venta.comisiones.length > 0)
        )
      } catch (error) {
        console.error('Error al eliminar la comisión:', error)
      }
    }
  }

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const calcularComision = (abono: number) => {
    return (abono * 0.92) * 0.1
  }

  const calcularTotalComisiones = (venta: VentaAgrupada) => {
    return venta.abonos.reduce((total, abono) => 
      total + calcularComision(abono.cantidad_abonada), 0
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-10">
            <h1 className="text-3xl font-bold mb-6">Tabla de Comisiones</h1>
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Usuario
                </label>
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : '')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                >
                  <option value="">Todos los usuarios</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Mes
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                >
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left"></th>
                    <th className="py-3 px-4 text-left">ID Venta</th>
                    <th className="py-3 px-4 text-left">Usuario</th>
                    <th className="py-3 px-4 text-left">Venta Total</th>
                    <th className="py-3 px-4 text-left">Tipo de Pago</th>
                    <th className="py-3 px-4 text-left">Comisión Total</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVentas.map((venta) => (
                    <React.Fragment key={venta.ventas_id_venta}>
                      <tr className="border-b hover:bg-gray-100">
                        <td className="py-3 px-4">
                          <button onClick={() => toggleRowExpansion(venta.ventas_id_venta)}>
                            {expandedRows.includes(venta.ventas_id_venta) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                        <td className="py-3 px-4">{venta.ventas_id_venta}</td>
                        <td className="py-3 px-4">{venta.empleado_name}</td>
                        <td className="py-3 px-4">${venta.venta_total.toLocaleString('es-CL')}</td>
                        <td className="py-3 px-4">{venta.tipo_pago}</td>
                        <td className="py-3 px-4">${calcularTotalComisiones(venta).toLocaleString('es-CL')}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleEdit(venta.ventas_id_venta)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(venta.ventas_id_venta)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                      {expandedRows.includes(venta.ventas_id_venta) && (
                        <tr>
                          <td colSpan={7}>
                            <div className="p-4 bg-gray-50">
                              <h4 className="font-semibold mb-2">Abonos:</h4>
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="py-2 px-4 text-left">ID Abono</th>
                                    <th className="py-2 px-4 text-left">Cantidad Abonada</th>
                                    <th className="py-2 px-4 text-left">Fecha Abono</th>
                                    <th className="py-2 px-4 text-left">Comisión</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {venta.abonos.map((abono) => (
                                    <tr key={abono.id}>
                                      <td className="py-2 px-4">{abono.id}</td>
                                      <td className="py-2 px-4">${abono.cantidad_abonada.toLocaleString('es-CL')}</td>
                                      <td className="py-2 px-4">{new Date(abono.fecha_abono).toLocaleDateString()}</td>
                                      <td className="py-2 px-4">
                                        ${calcularComision(abono.cantidad_abonada).toLocaleString('es-CL')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}