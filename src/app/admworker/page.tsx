'use client'

import React, { useState, useEffect, useCallback } from "react"
import supabase from "../../../lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { Edit2, Trash2, X, Check, Search, Filter, Bell, Menu, LogOut, UserPlus } from 'lucide-react'
import Image from 'next/image'

interface Trabajador {
  id: number
  name: string | null
  email: string | null
  role: string | null
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
        <button className="text-white hover:text-gray-200 transition-colors">
          <Bell size={24} />
        </button>
        <button className="text-white hover:text-gray-200 transition-colors">
          <Menu size={24} />
        </button>
        <button className="text-white hover:text-gray-200 transition-colors">
          <LogOut size={24} />
        </button>
      </div>
    </motion.header>
  )
}

export default function AdminTrabajadores() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null)
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
  }, [])

  useEffect(() => {
    fetchTrabajadores()
  }, [fetchTrabajadores])

  useEffect(() => {
    const filtered = trabajadores.filter(trabajador =>
      (trabajador.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       trabajador.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredTrabajadores(filtered)
  }, [searchTerm, trabajadores])

  const handleSelectTrabajador = (trabajador: Trabajador) => {
    setSelectedTrabajador(trabajador)
    setEditableTrabajador(null)
  }

  const handleEditClick = (trabajador: Trabajador) => {
    setEditableTrabajador(trabajador)
    setSelectedTrabajador(null)
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      await fetchTrabajadores()
      setSelectedTrabajador(null)
    } catch (error) {
      console.error("Error al eliminar el trabajador:", error)
      setError("Error al eliminar el trabajador. Por favor, intente de nuevo.")
    }
  }

  const handleUpdate = async (updatedTrabajador: Trabajador) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: updatedTrabajador.name,
          email: updatedTrabajador.email,
          role: updatedTrabajador.role,
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
    return <div>Loading...</div>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ul className="space-y-4">
                {filteredTrabajadores.map(trabajador => (
                  <motion.li 
                    key={trabajador.id} 
                    className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-md transition duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{trabajador.name || "Nombre no disponible"}</p>
                      <p className="text-gray-600">{trabajador.email || "Email no disponible"}</p>
                      <p className="text-gray-500">{trabajador.role || "Rol no disponible"}</p>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditClick(trabajador)}
                        className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded transition duration-300 shadow-md"
                      >
                        <Edit2 className="mr-1" size={16} />
                        Editar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(trabajador.id)}
                        className="flex items-center bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded transition duration-300 shadow-md"
                      >
                        <Trash2 className="mr-1" size={16} />
                        Eliminar
                      </motion.button>
                    </div>
                  </motion.li>
                ))}
              </ul>

              <AnimatePresence>
                {editableTrabajador && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-lg"
                  >
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Editar Trabajador</h2>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (editableTrabajador) handleUpdate(editableTrabajador)
                    }}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={editableTrabajador.name || ""}
                          onChange={(e) => setEditableTrabajador({ ...editableTrabajador, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editableTrabajador.email || ""}
                          onChange={(e) => setEditableTrabajador({ ...editableTrabajador, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                        />
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <input
                          type="text"
                          value={editableTrabajador.role || ""}
                          onChange={(e) => setEditableTrabajador({ ...editableTrabajador, role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setEditableTrabajador(null)}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300 shadow-md"
                        >
                          <X className="mr-1 inline" size={16} />
                          Cancelar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="submit"
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-300 shadow-md"
                        >
                          <Check className="mr-1 inline" size={16} />
                          Guardar
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}