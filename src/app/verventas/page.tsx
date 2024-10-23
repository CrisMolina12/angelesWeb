'use client'

import { useState, useEffect } from 'react'
import supabase from "../../../lib/supabaseClient"
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, LogOut, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Calendar, X, Check } from 'lucide-react'

type Venta = {
  id: number
  client_id: string
  worker_id_integer: number
  servicio_id: string
  price: number
  description: string
  client_name: string
  worker_name: string
  service_name: string
  is_active: boolean
  next_appointment: string | null
}

type NewAppointment = {
  venta_id: number
  service_date: string
  start_time: string
  end_time: string
  description: string
}

export default function VentasActivas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [newAppointment, setNewAppointment] = useState<NewAppointment>({
    venta_id: 0,
    service_date: '',
    start_time: '',
    end_time: '',
    description: ''
  })
  const ventasPorPagina = 10

  useEffect(() => {
    fetchVentas()
  }, [])

  const fetchVentas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clients(name),
        users(name),
        servicios(name_servicio),
        citas(service_date, start_time)
      `)

    if (error) {
      console.error('Error fetching ventas:', error)
    } else if (data) {
      const ventasFormateadas = data.map(venta => {
        const futureCitas = venta.citas.filter((cita: any) => {
          const citaDateTime = new Date(`${cita.service_date}T${cita.start_time}`)
          return citaDateTime > new Date()
        }).sort((a: any, b: any) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())

        return {
          ...venta,
          client_name: venta.clients?.name || 'Cliente desconocido',
          worker_name: venta.users?.name || 'Trabajador desconocido',
          service_name: venta.servicios?.name_servicio || 'Servicio desconocido',
          is_active: futureCitas.length > 0,
          next_appointment: futureCitas.length > 0 ? `${futureCitas[0].service_date} ${futureCitas[0].start_time}` : null
        }
      })
      setVentas(ventasFormateadas)
    }
    setLoading(false)
  }

  const ventasFiltradas = ventas.filter(venta =>
    venta.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.service_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ventasActivas = ventasFiltradas.filter(venta => venta.is_active)
  const ventasInactivas = ventasFiltradas.filter(venta => !venta.is_active)

  const indexOfLastVenta = currentPage * ventasPorPagina
  const indexOfFirstVenta = indexOfLastVenta - ventasPorPagina
  const ventasActuales = ventasFiltradas.slice(indexOfFirstVenta, indexOfLastVenta)

  const pageNumbers = []
  for (let i = 1; i <= Math.ceil(ventasFiltradas.length / ventasPorPagina); i++) {
    pageNumbers.push(i)
  }

  const handleEditVenta = (venta: Venta) => {
    setSelectedVenta(venta)
    setShowEditModal(true)
  }

  const handleUpdateVenta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVenta) return

    const { error } = await supabase
      .from('ventas')
      .update({
        price: selectedVenta.price,
        description: selectedVenta.description
      })
      .eq('id', selectedVenta.id)

    if (error) {
      console.error('Error updating venta:', error)
      alert('Hubo un error al actualizar la venta. Por favor, inténtalo de nuevo.')
    } else {
      setShowEditModal(false)
      fetchVentas()
      alert('Venta actualizada con éxito.')
    }
  }

  const handleDeleteVenta = async (id: number) => {
    const isConfirmed = window.confirm('¿Estás seguro de que quieres eliminar esta venta?')
    
    if (isConfirmed) {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting venta:', error)
        alert('Hubo un error al eliminar la venta. Por favor, inténtalo de nuevo.')
      } else {
        fetchVentas()
        alert('Venta eliminada con éxito.')
      }
    }
  }

  const handleViewDetails = (venta: Venta) => {
    setSelectedVenta(venta)
    setShowDetailsModal(true)
  }

  const handleAddAppointment = (id: number) => {
    setNewAppointment({ ...newAppointment, venta_id: id })
    setShowNewAppointmentModal(true)
  }

  const handleNewAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewAppointment(prev => ({ ...prev, [name]: value }))
  }

  const handleNewAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('citas')
      .insert({
        venta_id: newAppointment.venta_id,
        service_date: newAppointment.service_date,
        start_time: newAppointment.start_time,
        end_time: newAppointment.end_time,
        description: newAppointment.description
      })

    if (error) {
      console.error('Error adding new appointment:', error)
      alert('Hubo un error al agregar la cita. Por favor, inténtalo de nuevo.')
    } else {
      setShowNewAppointmentModal(false)
      fetchVentas()
      alert('Cita agregada con éxito.')
    }
  }

  if (loading) {
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

  const renderVentasTable = (ventas: Venta[], title: string) => (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trabajador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Cita</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td className="px-6 py-4 whitespace-nowrap">{venta.client_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{venta.worker_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{venta.service_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">${venta.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {venta.next_appointment 
                    ? new Date(venta.next_appointment).toLocaleString()
                    : 'No hay citas futuras'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleViewDetails(venta)} className="text-indigo-600 hover:text-indigo-900 mr-2">
                    <Eye size={20} />
                  </button>
                  <button onClick={() => handleEditVenta(venta)} className="text-yellow-600 hover:text-yellow-900 mr-2">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDeleteVenta(venta.id)} className="text-red-600 hover:text-red-900 mr-2">
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleAddAppointment(venta.id)} 
                    className="text-green-600 hover:text-green-900 flex items-center"
                  >
                    <Calendar size={20} className="mr-1" />
                    <span>Agregar Cita</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-2xl"
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
              Angeles - Ventas
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Ventas</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar ventas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>

            {renderVentasTable(ventasActivas, "Ventas Activas")}
            {renderVentasTable(ventasInactivas, "Ventas Inactivas")}

            <div className="mt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indexOfFirstVenta + 1}</span> a <span className="font-medium">{Math.min(indexOfLastVenta, ventasFiltradas.length)}</span> de <span className="font-medium">{ventasFiltradas.length}</span> resultados
                </p>
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={()=> setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {pageNumbers.map(number => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === number ? '!bg-purple-600 !text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageNumbers.length))}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showNewAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-medium mb-4">Agregar Nueva Cita</h3>
              <form onSubmit={handleNewAppointmentSubmit} className="space-y-4">
                <div>
                  <label htmlFor="service_date" className="block text-sm font-medium text-gray-700">Fecha del Servicio</label>
                  <input
                    type="date"
                    id="service_date"
                    name="service_date"
                    required
                    value={newAppointment.service_date}
                    onChange={handleNewAppointmentChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Hora de Inicio</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    required
                    value={newAppointment.start_time}
                    onChange={handleNewAppointmentChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">Hora de Fin</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    required
                    value={newAppointment.end_time}
                    onChange={handleNewAppointmentChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={newAppointment.description}
                    onChange={handleNewAppointmentChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Ingrese una descripción para la cita"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointmentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Agregar Cita
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailsModal && selectedVenta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-medium mb-4">Detalles de la Venta</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Cliente:</span> {selectedVenta.client_name}</p>
                <p><span className="font-medium">Trabajador:</span> {selectedVenta.worker_name}</p>
                <p><span className="font-medium">Servicio:</span> {selectedVenta.service_name}</p>
                <p><span className="font-medium">Precio:</span> ${selectedVenta.price}</p>
                <p><span className="font-medium">Descripción:</span> {selectedVenta.description}</p>
                <p><span className="font-medium">Próxima Cita:</span> {selectedVenta.next_appointment ? new Date(selectedVenta.next_appointment).toLocaleString() : 'No hay citas futuras'}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedVenta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-medium mb-4">Editar Venta</h3>
              <form onSubmit={handleUpdateVenta} className="space-y-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
                  <input
                    type="number"
                    id="price"
                    value={selectedVenta.price}
                    onChange={(e) => setSelectedVenta({...selectedVenta, price: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    id="description"
                    value={selectedVenta.description}
                    onChange={(e) => setSelectedVenta({...selectedVenta, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}