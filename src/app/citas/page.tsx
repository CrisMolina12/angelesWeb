'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Search, Plus, X, Edit2, Check, Bell, Menu, LogOut, Home, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import moment from 'moment'
import 'moment/locale/es'

moment.locale('es')

interface Sale {
  id: number
  client_name: string
  service_name: string
  fecha_transaccion: string
  cant_sesiones: number
  appointment_count: number
}

interface Appointment {
  id: number
  service_date: string
  start_time: string
  end_time: string
  description: string
}

export default function AssignAppointments() {
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [displayedSales, setDisplayedSales] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id'>>({
    service_date: '',
    start_time: '',
    end_time: '',
    description: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSessions, setEditingSessions] = useState(false)
  const [newTotalSessions, setNewTotalSessions] = useState<number | ''>('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          fecha_transaccion,
          clients (name),
          servicios (name_servicio),
          detalle_venta (cant_sesiones),
          citas (id)
        `)
        .order('fecha_transaccion', { ascending: false })

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from Supabase')
      }

      const formattedSales = data.map((sale) => ({
        id: sale.id,
        client_name: sale.clients?.[0]?.name ?? 'Cliente desconocido',
        service_name: sale.servicios?.[0]?.name_servicio ?? 'Servicio desconocido',
        fecha_transaccion: sale.fecha_transaccion || 'Fecha desconocida',
        cant_sesiones: sale.detalle_venta?.[0]?.cant_sesiones ?? 1,
        appointment_count: sale.citas?.length ?? 0,
      }))

      setAllSales(formattedSales)
      updateDisplayedSales(formattedSales)
    } catch (error) {
      console.error('Error fetching sales:', error)
      setError(`Failed to fetch sales: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateDisplayedSales = useCallback((sales: Sale[]) => {
    const filteredSales = sales.filter(sale =>
      sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.service_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setTotalPages(Math.ceil(filteredSales.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedSales(filteredSales.slice(startIndex, endIndex))
  }, [searchTerm, currentPage])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
        fetchSales()
      }
    }
    checkAuth()
  }, [router, fetchSales])

  useEffect(() => {
    updateDisplayedSales(allSales)
  }, [allSales, updateDisplayedSales])

  const fetchAppointments = async (saleId: number) => {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select('*')
        .eq('venta_id', saleId)
        .order('service_date', { ascending: true })

      if (error) throw error

      setAppointments(data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Failed to fetch appointments. Please try again.')
    }
  }

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale)
    fetchAppointments(sale.id)
    setNewTotalSessions(sale.cant_sesiones)
  }

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSale) return

    try {
      const { data, error } = await supabase
        .from('citas')
        .insert([
          {
            ...newAppointment,
            venta_id: selectedSale.id,
          },
        ])
        .select()

      if (error) throw error

      setAppointments([...appointments, data[0]])
      setNewAppointment({
        service_date: '',
        start_time: '',
        end_time: '',
        description: '',
      })

      // Update the appointment count for the selected sale
      const updatedSale = { ...selectedSale, appointment_count: selectedSale.appointment_count + 1 }
      setSelectedSale(updatedSale)
      setAllSales(allSales.map(sale => sale.id === updatedSale.id ? updatedSale : sale))
      updateDisplayedSales(allSales.map(sale => sale.id === updatedSale.id ? updatedSale : sale))
    } catch (error) {
      console.error('Error adding appointment:', error)
      setError('Failed to add appointment. Please try again.')
    }
  }

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!selectedSale) return

    try {
      const { error } = await supabase
        .from('citas')
        .delete()
        .eq('id', appointmentId)

      if (error) throw error

      setAppointments(appointments.filter(app => app.id !== appointmentId))

      // Update the appointment count for the selected sale
      const updatedSale = { ...selectedSale, appointment_count: selectedSale.appointment_count - 1 }
      setSelectedSale(updatedSale)
      setAllSales(allSales.map(sale => sale.id === updatedSale.id ? updatedSale : sale))
      updateDisplayedSales(allSales.map(sale => sale.id === updatedSale.id ? updatedSale : sale))
    } catch (error) {
      console.error('Error deleting appointment:', error)
      setError('Failed to delete appointment. Please try again.')
    }
  }

  const handleUpdateTotalSessions = async () => {
    if (!selectedSale || typeof newTotalSessions !== 'number') return

    try {
      const { error } = await supabase
        .from('detalle_venta')
        .update({ cant_sesiones: newTotalSessions })
        .eq('ventas_id_venta', selectedSale.id)

      if (error) throw error

      const updatedSale = { ...selectedSale, cant_sesiones: newTotalSessions }
      setSelectedSale(updatedSale)
      setAllSales(allSales.map(sale => 
        sale.id === updatedSale.id ? updatedSale : sale
      ))
      updateDisplayedSales(allSales.map(sale => 
        sale.id === updatedSale.id ? updatedSale : sale
      ))
      setEditingSessions(false)
    } catch (error) {
      console.error('Error updating total sessions:', error)
      setError('Failed to update total sessions. Please try again.')
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setIsAuthenticated(false)
      router.push('/login')
    }
  }

  if (!isAuthenticated) {
    return null // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
            <Link href="/jefe" className="text-white hover:text-gray-200 transition-colors">
              <Home size={24} />
              <span className="sr-only">Volver a la página principal</span>
            </Link>
            <button className="text-white hover:text-gray-200 transition-colors">
              <Bell size={24} />
            </button>
            <div className="relative">
              <button 
                className="text-white hover:text-gray-200 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu size={24} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-10">
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <LogOut className="inline-block mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Asignar Citas Adicionales</h1>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar ventas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                />
                <p className="mt-4 text-gray-600">Cargando ventas...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Ventas</h2>
                  <div className="space-y-4">
                    {displayedSales.map((sale) => (
                      <motion.div
                        key={sale.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedSale?.id === sale.id ? 'bg-purple-100' : 'bg-white'
                        }`}
                        onClick={() => handleSelectSale(sale)}
                      >
                        <p className="font-semibold">{sale.client_name}</p>
                        <p className="text-sm text-gray-600">{sale.service_name}</p>
                        <p className="text-sm text-gray-500">{moment(sale.fecha_transaccion).format('LL')}</p>
                        <p className="text-sm text-purple-600 mt-2">
                          Sesiones: {sale.appointment_count}/{sale.cant_sesiones}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      
                      className="p-2 bg-purple-500 text-white rounded-lg disabled:bg-gray-300"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-purple-500 text-white rounded-lg disabled:bg-gray-300"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Citas</h2>
                  {selectedSale ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-semibold">
                          Progreso: {selectedSale.appointment_count}/{selectedSale.cant_sesiones} sesiones
                        </p>
                        {editingSessions ? (
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={newTotalSessions}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                setNewTotalSessions(isNaN(value) ? '' : Math.max(1, value));
                              }}
                              className="w-16 p-1 border rounded-lg mr-2"
                              min="1"
                            />
                            <button
                              onClick={handleUpdateTotalSessions}
                              className="bg-green-500 text-white p-1 rounded-lg hover:bg-green-600"
                              disabled={typeof newTotalSessions !== 'number'}
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingSessions(true)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="mb-4 space-y-2 max-h-64 overflow-y-auto">
                        {appointments.map((appointment) => (
                          <motion.div
                            key={appointment.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-between items-center bg-white p-3 rounded-lg"
                          >
                            <div>
                              <p className="font-semibold">{moment(appointment.service_date).format('LL')}</p>
                              <p className="text-sm text-gray-600">
                                {appointment.start_time} - {appointment.end_time}
                              </p>
                              <p className="text-sm text-gray-500">{appointment.description}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={20} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      <form onSubmit={handleAddAppointment} className="space-y-4">
                        <input
                          type="date"
                          value={newAppointment.service_date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, service_date: e.target.value })}
                          className="w-full p-2 border rounded-lg"
                          required
                        />
                        <div className="flex space-x-2">
                          <input
                            type="time"
                            value={newAppointment.start_time}
                            onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })}
                            className="w-1/2 p-2 border rounded-lg"
                            required
                          />
                          <input
                            type="time"
                            value={newAppointment.end_time}
                            onChange={(e) => setNewAppointment({ ...newAppointment, end_time: e.target.value })}
                            className="w-1/2 p-2 border rounded-lg"
                            required
                          />
                        </div>
                        <input
                          type="text"
                          value={newAppointment.description}
                          onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                          placeholder="Descripción"
                          className="w-full p-2 border rounded-lg"
                          required
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="submit"
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <Plus size={20} className="mr-2" />
                          Agregar Cita
                        </motion.button>
                      </form>
                    </>
                  ) : (
                    <p className="text-gray-500">Selecciona una venta para ver o agregar citas.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}