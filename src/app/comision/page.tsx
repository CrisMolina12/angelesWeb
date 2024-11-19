'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import supabase from "../../../lib/supabaseClient"
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

type Comision = {
  id_comision: number
  ventas_id_venta: number
  empleado_id_empleado: number
  monto_comision: number
  fecha_comision: string
  empleado_name?: string
  porcentaje_tipo_pago?: number
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
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [filteredComisiones, setFilteredComisiones] = useState<Comision[]>([])
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
          venta:ventas_id_venta(tipo_pago(porcentaje))
        `)
        .order('fecha_comision', { ascending: false })

      if (error) throw error

      if (data) {
        const comisionesData = data.map(comision => ({
          ...comision,
          empleado_name: comision.empleado?.name,
          porcentaje_tipo_pago: comision.venta?.tipo_pago?.porcentaje
        }))
        setComisiones(comisionesData)
        setFilteredComisiones(comisionesData)
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

  const filterComisiones = useCallback(() => {
    let filtered = [...comisiones]

    if (selectedUser) {
      filtered = filtered.filter(comision => comision.empleado_id_empleado === selectedUser)
    }

    if (selectedMonth) {
      filtered = filtered.filter(comision => {
        const comisionDate = new Date(comision.fecha_comision)
        return comisionDate.getMonth() === parseInt(selectedMonth) - 1 // Months are 0-indexed
      })
    }

    setFilteredComisiones(filtered)
  }, [comisiones, selectedUser, selectedMonth])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    filterComisiones()
  }, [filterComisiones])

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
                    <th className="py-3 px-4 text-left">ID Comisión</th>
                    <th className="py-3 px-4 text-left">ID Venta</th>
                    <th className="py-3 px-4 text-left">Usuario</th>
                    <th className="py-3 px-4 text-left">Monto Comisión</th>
                    <th className="py-3 px-4 text-left">Fecha Comisión</th>
                    <th className="py-3 px-4 text-left">% Tipo de Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComisiones.map((comision) => (
                    <tr key={comision.id_comision} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-4">{comision.id_comision}</td>
                      <td className="py-3 px-4">{comision.ventas_id_venta}</td>
                      <td className="py-3 px-4">{comision.empleado_name}</td>
                      <td className="py-3 px-4">${comision.monto_comision.toLocaleString('es-CL')}</td>
                      <td className="py-3 px-4">{new Date(comision.fecha_comision).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{comision.porcentaje_tipo_pago}%</td>
                    </tr>
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