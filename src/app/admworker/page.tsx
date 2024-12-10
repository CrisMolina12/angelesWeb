'use client'

import React, { useState, useEffect, useCallback } from "react"
import supabase from "../../../lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { Edit2, X, Check, Search, Filter, Home, UserPlus } from 'lucide-react'
import Image from 'next/image'
import Link from "next/link"

interface Trabajador {
  id: number
  name: string | null
  email: string | null
  role: string | null
  porcent_comision: number | null
}

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-2xl max-w-6xl mx-auto"
    >
      <div className="flex items-center space-x-4">
        <Image
          src="/Imagen1.png" 
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

export default function AdminTrabajadores() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editableTrabajador, setEditableTrabajador] = useState<Trabajador | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTrabajadores, setFilteredTrabajadores] = useState<Trabajador[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTrabajadores = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: trabajadores, error } = await supabase
        .from("users")
        .select("*")
        .order("name", { ascending: true })

      if (error) {
        throw error
      }

      if (trabajadores) {
        setTrabajadores(trabajadores as Trabajador[])
        setFilteredTrabajadores(trabajadores as Trabajador[])
      }
    } catch (error) {
      console.error("Error al obtener los trabajadores:", error)
      setError("Error al cargar los trabajadores. Por favor, intente de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user || !user.email) {
        window.location.href = '/login'
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single()

      if (userError || !userData) {
        window.location.href = '/login'
        return
      }

      setRole(userData.role)
    }

    fetchUserRole()
    fetchTrabajadores()
  }, [fetchTrabajadores])

  useEffect(() => {
    const filtered = trabajadores.filter(trabajador =>
      (trabajador.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       trabajador.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredTrabajadores(filtered)
  }, [searchTerm, trabajadores])

  const handleEditClick = (trabajador: Trabajador) => {
    setEditableTrabajador(trabajador)
  }

  const handleUpdate = async (updatedTrabajador: Trabajador) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: updatedTrabajador.name,
          email: updatedTrabajador.email,
          role: updatedTrabajador.role,
          porcent_comision: updatedTrabajador.porcent_comision,
        })
        .eq("id", updatedTrabajador.id)

      if (error) {
        throw error
      }

      await fetchTrabajadores()
      setEditableTrabajador(null)
    } catch (error) {
      console.error("Error al actualizar el trabajador:", error)
      setError("Error al actualizar el trabajador. Por favor, intente de nuevo.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (role === null) {
    return <div>Cargando...</div>
  }

  if (role !== 'admin') {
    window.location.href = '/autorizacion'
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <Header />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Administración de Trabajadores</h1>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" 
                role="alert"
              >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </motion.div>
            )}

            <div className="mb-6 flex items-center">
              <div className="relative flex-grow mr-2">
                <input
                  type="text"
                  placeholder="Buscar trabajadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition duration-300 shadow-md"
              >
                <Filter size={20} />
              </motion.button>
            </div>

            <div className="flex justify-end mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition duration-300 shadow-sm text-sm flex items-center"
                onClick={() => window.location.href = '/dashboard'}
              >
                <UserPlus size={16} className="mr-1" />
                <span>Crear Usuario/Trabajador</span>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ul className="space-y-4">
                {filteredTrabajadores.map((trabajador) => (
                  <li key={trabajador.id} className="p-4 bg-gray-100 rounded-lg shadow-md flex justify-between items-center">
                    <div className="flex-grow">
                      <h2 className="text-lg font-bold">{trabajador.name}</h2>
                      <p className="text-sm text-gray-600">{trabajador.email}</p>
                      <p className="text-sm text-gray-500">Rol: {trabajador.role}</p>
                      <p className="text-sm text-gray-500">Comisión: {trabajador.porcent_comision !== null ? `${trabajador.porcent_comision}%` : 'No asignada'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditClick(trabajador)}
                        className="text-blue-500 hover:text-blue-600 transition duration-300"
                      >
                        <Edit2 size={20} />
                      </motion.button>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <AnimatePresence>
              {editableTrabajador && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 bg-white p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-bold mb-4">Editar Trabajador</h3>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (editableTrabajador) {
                        handleUpdate(editableTrabajador)
                      }
                    }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      value={editableTrabajador.name || ''}
                      onChange={(e) => setEditableTrabajador({ ...editableTrabajador, name: e.target.value })}
                      placeholder="Nombre"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="email"
                      value={editableTrabajador.email || ''}
                      onChange={(e) => setEditableTrabajador({ ...editableTrabajador, email: e.target.value })}
                      placeholder="Correo Electrónico"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      value={editableTrabajador.porcent_comision || ''}
                      onChange={(e) => setEditableTrabajador({ ...editableTrabajador, porcent_comision: parseFloat(e.target.value) || null })}
                      placeholder="Porcentaje de Comisión"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <select
                      value={editableTrabajador.role || ''}
                      onChange={(e) => setEditableTrabajador({ ...editableTrabajador, role: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="" disabled>Seleccionar Rol</option>
                      <option value="admin">Admin</option>
                      <option value="worker">Trabajador</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                      <motion.button
                        type="button"
                        onClick={() => setEditableTrabajador(null)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gray-200 text-gray-800 p-2 rounded-lg"
                      >
                        <X size={20} />
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300"
                      >
                        <Check size={20} />
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

