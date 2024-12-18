'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import supabase from "../../../lib/supabaseClient"
import { motion } from 'framer-motion'
import { Plus, Edit, X, Check, ToggleLeft, ToggleRight, Home,  } from 'lucide-react'

interface Servicio {
  id: number
  name_servicio: string
  cant_sesiones: number
  estado_servicio_id: number
  estado_servicio: {
    estado: 'Activo' | 'Inactivo'
  }
  precio_servicio: number | null
}

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-4 sm:mb-8 rounded-2xl"
    >
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
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

export default function ServicioManagement() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [newServicio, setNewServicio] = useState<Omit<Servicio, 'id' | 'estado_servicio'>>({
    name_servicio: '',
    cant_sesiones: 1,
    estado_servicio_id: 1,
    precio_servicio: null
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    setIsAuthenticated(true)

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !userData || userData.role !== 'admin') {
      router.push('/autorizacion')
      return
    }

    setIsAdmin(true)
    fetchServicios()
  }

  const fetchServicios = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select(`*, estado_servicio (id, estado)`)
        .order('name_servicio', { ascending: true })

      if (error) throw error
      setServicios(data || [])
    } catch (error) {
      console.error('Error fetching servicios:', error)
      setError('Failed to fetch servicios. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddServicio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServicio.name_servicio || newServicio.cant_sesiones < 1 || newServicio.precio_servicio === null) {
      setError('Por favor, complete todos los campos correctamente.')
      return
    }
    try {
      const { error } = await supabase
        .from('servicios')
        .insert([{ ...newServicio }])

      if (error) throw error
      await fetchServicios()
      setNewServicio({ name_servicio: '', cant_sesiones: 1, estado_servicio_id: 1, precio_servicio: null })
      setError(null)
    } catch (error) {
      console.error('Error adding servicio:', error)
      setError('Failed to add servicio. Please check your input.')
    }
  }

  const handleEditServicio = async (servicio: Servicio) => {
    try {
      const { error } = await supabase
        .from('servicios')
        .update({
          name_servicio: servicio.name_servicio,
          cant_sesiones: servicio.cant_sesiones,
          estado_servicio_id: servicio.estado_servicio_id,
          precio_servicio: servicio.precio_servicio
        })
        .eq('id', servicio.id)

      if (error) throw error
      await fetchServicios()
      setEditingId(null)
      setEditingServicio(null)
    } catch (error) {
      console.error('Error updating servicio:', error)
      setError('Failed to update servicio. Please try again.')
    }
  }

  const toggleServicioStatus = async (servicio: Servicio) => {
    try {
      const newEstado = servicio.estado_servicio.estado === 'Activo' ? 'Inactivo' : 'Activo'
      const { data: estadoData, error: estadoError } = await supabase
        .from('estado_servicio')
        .select('id')
        .eq('estado', newEstado)
        .single()

      if (estadoError) throw estadoError

      const { error } = await supabase
        .from('servicios')
        .update({ estado_servicio_id: estadoData.id })
        .eq('id', servicio.id)

      if (error) throw error
      await fetchServicios()
    } catch (error) {
      console.error('Error toggling servicio status:', error)
      setError('Failed to update servicio status. Please try again.')
    }
  }

  const filteredServicios = servicios.filter((servicio) =>
    servicio.name_servicio.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-2 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-4 sm:p-6 md:p-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Gestión de Servicios</h1>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white shadow-md rounded-lg overflow-hidden mb-6 sm:mb-8"
            >
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Agregar Nuevo Servicio</h2>
                <form onSubmit={handleAddServicio} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name_servicio" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Servicio
                      </label>
                      <input
                        id="name_servicio"
                        type="text"
                        placeholder="Ej: Masaje relajante"
                        value={newServicio.name_servicio}
                        onChange={(e) => setNewServicio({ ...newServicio, name_servicio: e.target.value })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cant_sesiones" className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad de Sesiones
                      </label>
                      <input
                        id="cant_sesiones"
                        type="number"
                        placeholder="Ej: 1"
                        value={newServicio.cant_sesiones}
                        onChange={(e) => setNewServicio({ ...newServicio, cant_sesiones: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="precio_servicio" className="block text-sm font-medium text-gray-700 mb-1">
                        Precio del Servicio
                      </label>
                      <input
                        id="precio_servicio"
                        type="number"
                        placeholder="Ej: 50000"
                        value={newServicio.precio_servicio ?? ''}
                        onChange={(e) => setNewServicio({ ...newServicio, precio_servicio: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        min="0"
                        step="1000"
                        required
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Servicio
                  </motion.button>
                </form>
              </div>
            </motion.div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar Servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                />
                <p className="mt-4 text-gray-600">Cargando servicios...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow-md rounded-lg overflow-x-auto"
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Nombre del Servicio</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Cantidad de Sesiones</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Estado</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Precio</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServicios.map((servicio) => (
                      <tr key={servicio.id}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm sm:px-6">
                          {editingId === servicio.id ? (
                            <input
                              type="text"
                              value={editingServicio?.name_servicio || ''}
                              onChange={(e) => setEditingServicio({ ...editingServicio!, name_servicio: e.target.value })}
                              className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                          ) : (
                            servicio.name_servicio
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm sm:px-6">
                          {editingId === servicio.id ? (
                            <input
                              type="number"
                              value={editingServicio?.cant_sesiones || 0}
                              onChange={(e) => setEditingServicio({ ...editingServicio!, cant_sesiones: parseInt(e.target.value) })}
                              className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              min="1"
                            />
                          ) : (
                            servicio.cant_sesiones
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm sm:px-6">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            servicio.estado_servicio.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {servicio.estado_servicio.estado}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm sm:px-6">
                          {editingId === servicio.id ? (
                            <input
                              type="number"
                              value={editingServicio?.precio_servicio ?? ''}
                              onChange={(e) => setEditingServicio({ ...editingServicio!, precio_servicio: e.target.value ? parseFloat(e.target.value) : null })}
                              className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              min="0"
                              step="1000"
                            />
                          ) : (
                            `$${servicio.precio_servicio != null ? servicio.precio_servicio.toLocaleString('es-CL') : 'No disponible'}`
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium sm:px-6">
                          {editingId === servicio.id ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditServicio(editingServicio!)}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                <Check className="h-5 w-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditingId(null)
                                  setEditingServicio(null)
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-5 w-5" />
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setEditingId(servicio.id)
                                  setEditingServicio(servicio)
                                }}
                                className="text-purple-600 hover:text-purple-900 mr-2 sm:mr-4"
                              >
                                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleServicioStatus(servicio)}
                                className={`${
                                  servicio.estado_servicio.estado === 'Activo' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                                }`}
                              >
                                {servicio.estado_servicio.estado === 'Activo' ? (
                                  <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </motion.button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

