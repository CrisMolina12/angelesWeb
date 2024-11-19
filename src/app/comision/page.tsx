'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import supabase from '../../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

type AbonoDetalle = {
  id: number
  cantidad_abonada: number
  fecha_abono: string
  id_tipo_pago: string
}

type Comision = {
  id_comision: number
  monto_comision: number
  fecha_comision: string
  empleado_name: string
  empleado_id: number
}

type Venta = {
  id_venta: number
  fecha_venta: string
  comisiones: Comision[]
  abonos: AbonoDetalle[]
}

type User = {
  id: number
  name: string
}

type UserCommissionTotal = {
  empleado_id: number
  empleado_name: string
  total_comision: number
}

type VentaData = {
  id: number
  fecha_transaccion: string
  comision: {
    id_comision: number
    monto_comision: number
    fecha_comision: string
    empleado: {
      id: number
      name: string
    }
  }[]
  abono: AbonoDetalle[]
}

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-2xl"
    >
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Image
          src="/Imagen1.png" 
          alt="Logo de Angeles"
          width={40}
          height={40}
          className="rounded-full border-2 border-white shadow-md"
        />
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg sm:text-2xl font-bold tracking-wide"
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
  const [ventas, setVentas] = useState<Venta[]>([])
  const [filteredVentas, setFilteredVentas] = useState<Venta[]>([])
  const [userCommissionTotals, setUserCommissionTotals] = useState<UserCommissionTotal[]>([])
  const [loading, setLoading] = useState(true)
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
  }, [router])

  const fetchVentas = useCallback(async () => {
    try {
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          id,
          fecha_transaccion,
          comision (
            id_comision,
            monto_comision,
            fecha_comision,
            empleado:empleado_id_empleado(id, name)
          ),
          abono (
            id,
            cantidad_abonada,
            fecha_abono,
            id_tipo_pago
          )
        `)
        .order('fecha_transaccion', { ascending: false })

      if (ventasError) throw ventasError

      if (ventasData) {
        console.log('Datos de ventas recibidos:', ventasData)
        const processedVentas: Venta[] = (ventasData as unknown as VentaData[]).map((venta) => ({
          id_venta: venta.id,
          fecha_venta: venta.fecha_transaccion, 
          comisiones: venta.comision.map((com) => ({
            id_comision: com.id_comision,
            monto_comision: com.monto_comision,
            fecha_comision: com.fecha_comision,
            empleado_name: com.empleado.name,
            empleado_id: com.empleado.id
          })),
          abonos: venta.abono
        }))

        setVentas(processedVentas)
        setFilteredVentas(processedVentas)
        calculateUserCommissionTotals(processedVentas)
      }
    } catch (error) {
      console.error('Error al obtener las ventas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
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
  }, [])

  const calculateUserCommissionTotals = useCallback((ventasData: Venta[]) => {
    const totalsMap: Record<number, UserCommissionTotal> = {}

    ventasData.forEach(venta => {
      venta.comisiones.forEach(comision => {
        const userId = comision.empleado_id
        if (!totalsMap[userId]) {
          totalsMap[userId] = {
            empleado_id: userId,
            empleado_name: comision.empleado_name,
            total_comision: 0
          }
        }
        totalsMap[userId].total_comision += comision.monto_comision
      })
    })

    const totalsArray = Object.values(totalsMap)
      .sort((a, b) => b.total_comision - a.total_comision)

    setUserCommissionTotals(totalsArray)
  }, [])

  const filterVentas = useCallback(() => {
    let filtered = [...ventas]

    if (selectedUser) {
      filtered = filtered.filter(venta => 
        venta.comisiones.some(comision => comision.empleado_id === selectedUser)
      )
    }

    if (selectedMonth) {
      filtered = filtered.filter(venta => {
        const ventaDate = new Date(venta.fecha_venta)
        return ventaDate.getMonth() === parseInt(selectedMonth) - 1
      })
    }

    console.log('Ventas filtradas:', filtered)

    setFilteredVentas(filtered)
    calculateUserCommissionTotals(filtered)
  }, [ventas, selectedUser, selectedMonth, calculateUserCommissionTotals])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchVentas()
      fetchUsers()
    }
  }, [isAuthenticated, isAdmin, fetchVentas, fetchUsers])

  useEffect(() => {
    if (ventas.length > 0) {
      filterVentas()
    }
  }, [selectedUser, selectedMonth, filterVentas, ventas])

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
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden mb-6">
          <div className="p-6 sm:p-10">
            <h2 className="text-2xl font-bold mb-4">Resumen de Comisiones por Empleado</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Empleado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Total Comisiones</th>
                  </tr>
                </thead>
                <tbody>
                  {userCommissionTotals.map((total) => (
                    <tr key={`total-${total.empleado_id}`}>
                      <td className="px-6 py-4 text-sm">{total.empleado_name}</td>
                      <td className="px-6 py-4 text-sm font-semibold">${total.total_comision.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-10">
            <h1 className="text-3xl font-bold mb-6">Tabla de Ventas y Comisiones</h1>
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
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Fecha de Venta</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">ID Venta</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Comisiones</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Abonos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVentas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No hay ventas que mostrar</td>
                    </tr>
                  ) : (
                    filteredVentas.map((venta, index) => (
                      <tr key={`venta-${venta.id_venta || index}`}>
                        <td className="px-6 py-4 text-sm">
                          {venta.fecha_venta 
                            ? new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) 
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">{venta.id_venta || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          {venta.comisiones.map((comision, comIndex) => (
                            <div key={`comision-${venta.id_venta || index}-${comision.id_comision || comIndex}`} className={comIndex > 0 ? 'mt-2' : ''}>
                              {comision.empleado_name}: ${comision.monto_comision.toFixed(2)}
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {venta.abonos.map((abono, abonoIndex) => (
                            <div key={`abono-${venta.id_venta || index}-${abono.id || abonoIndex}`} className={abonoIndex > 0 ? 'mt-2' : ''}>
                              ${abono.cantidad_abonada.toFixed(2)} - {new Date(abono.fecha_abono).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} - {abono.id_tipo_pago}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}