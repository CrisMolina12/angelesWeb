'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import supabase from "../../../lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react'

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
  total_paid: number
  appointment_count: number
  id_tipo_pago: number
  tipo_pago?: TipoPago
}

type NewPayment = {
  ventas_id_venta: number
  amount: number
  id_tipo_pago: number
}

type TipoPago = {
  id_tipo_pago: number
  name_comision: string
  porcentaje: number
}

type Cita = {
  id: number
  service_date: string
  start_time: string
}

export default function VentasActivas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [newPayment, setNewPayment] = useState<NewPayment>({
    ventas_id_venta: 0,
    amount: 0,
    id_tipo_pago: 0
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([])
  const router = useRouter()
  
  const ventasPorPagina = 10

  useEffect(() => {
    checkUserRole()
    fetchTiposPago()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single()

      if (userError || !userData) {
        console.error('Error al obtener el rol del usuario:', userError)
        setError('Error al obtener el rol del usuario')
        return
      }

      setUserRole(userData.role)
      fetchVentas()
    } catch (error) {
      console.error('Error al verificar el rol del usuario:', error)
      setError('Error al verificar el rol del usuario')
    }
  }

  const fetchTiposPago = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_pago')
        .select('*')

      if (error) throw error

      setTiposPago(data)
    } catch (error) {
      console.error('Error al obtener los tipos de pago:', error)
      setError('Error al obtener los tipos de pago')
    }
  }

  const fetchVentas = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          clients (name),
          users (name),
          servicios (name_servicio),
          citas (id, service_date, start_time),
          abono (cantidad_abonada),
          tipo_pago (id_tipo_pago, name_comision, porcentaje)
        `)

      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(`Error al obtener las ventas: ${error.message}`)
      }

      if (!data) {
        throw new Error('No se recibieron datos de Supabase')
      }

      const ventasFormateadas = data
        .filter(venta => venta.tipo_pago !== null)
        .map(venta => {
          const totalPaid = venta.abono ? venta.abono.reduce((sum: number, abono: { cantidad_abonada: number }) => sum + abono.cantidad_abonada, 0) : 0
          const futureCitas = (venta.citas as Cita[])
            .filter(cita => new Date(`${cita.service_date}T${cita.start_time}`) > new Date())
            .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime())
          
          return {
            ...venta,
            client_name: venta.clients?.name || 'Cliente desconocido',
            worker_name: venta.users?.name || 'Trabajador desconocido',
            service_name: venta.servicios?.name_servicio || 'Servicio desconocido',
            is_active: futureCitas.length > 0,
            next_appointment: futureCitas.length > 0 ? `${futureCitas[0].service_date} ${futureCitas[0].start_time}` : null,
            total_paid: totalPaid,
            appointment_count: venta.citas ? venta.citas.length : 0,
            id_tipo_pago: venta.tipo_pago?.id_tipo_pago,
            tipo_pago: venta.tipo_pago
          }
        })
      setVentas(ventasFormateadas)
    } catch (error) {
      console.error('Error en fetchVentas:', error)
      setError(error instanceof Error ? error.message : 'Ocurrió un error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleEditVenta = (venta: Venta) => {
    setSelectedVenta(venta)
    setShowEditModal(true)
  }

  const handleUpdateVenta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVenta) return

    try {
      const { error } = await supabase
        .from('ventas')
        .update({
          price: selectedVenta.price,
          description: selectedVenta.description,
          id_tipo_pago: selectedVenta.id_tipo_pago
        })
        .eq('id', selectedVenta.id)

      if (error) throw error

      setShowEditModal(false)
      fetchVentas()
      alert('Venta actualizada con éxito.')
    } catch (error) {
      console.error('Error al actualizar la venta:', error)
      alert('Hubo un error al actualizar la venta. Por favor, inténtalo de nuevo.')
    }
  }

  const handleDeleteVenta = async (id: number) => {
    const isConfirmed = window.confirm('¿Estás seguro de que quieres eliminar esta venta?')
    
    if (isConfirmed) {
      try {
        const { error } = await supabase
          .from('ventas')
          .delete()
          .eq('id', id)

        if (error) throw error

        fetchVentas()
        alert('Venta eliminada con éxito.')
      } catch (error) {
        console.error('Error al eliminar la venta:', error)
        alert('Hubo un error al eliminar la venta. Por favor, inténtalo de nuevo.')
      }
    }
  }

  const handleViewDetails = (venta: Venta) => {
    setSelectedVenta(venta)
    setShowDetailsModal(true)
  }

  const handleAddPayment = (venta: Venta) => {
    setSelectedVenta(venta)
    setNewPayment({ ventas_id_venta: venta.id, amount: 0, id_tipo_pago: venta.id_tipo_pago })
    setShowPaymentModal(true)
  }

  const handleNewPaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const numericValue = name === 'amount' ? parseFloat(value) : parseInt(value, 10)
    setNewPayment(prev => ({
      ...prev,
      [name]: isNaN(numericValue) ? 0 : numericValue
    }))
  }

  const handleNewPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVenta) return

    const remainingAmount = selectedVenta.price - selectedVenta.total_paid
    if (newPayment.amount > remainingAmount) {
      alert(`El pago no puede exceder el monto restante de ${formatCurrency(remainingAmount)}`)
      return
    }

    try {
      const { data: abonoData, error: abonoError } = await supabase
        .from('abono')
        .insert({
          ventas_id_venta: newPayment.ventas_id_venta,
          cantidad_abonada: newPayment.amount,
          fecha_abono: new Date().toISOString(),
          id_tipo_pago: newPayment.id_tipo_pago
        })
        .select()

      if (abonoError) {
        console.error('Error al insertar abono:', abonoError)
        throw abonoError
      }

      console.log('Abono insertado con éxito:', abonoData)

      const tipoPago = tiposPago.find(tp => tp.id_tipo_pago === newPayment.id_tipo_pago)
      if (!tipoPago) {
        console.error('Tipo de pago no encontrado:', newPayment.id_tipo_pago)
        alert('Error: Tipo de pago no encontrado. Por favor, seleccione un tipo de pago válido.')
        return
      }

      const montoConPorcentajeTipoPago = newPayment.amount * (1 - tipoPago.porcentaje / 100)
      const comision = Math.round(montoConPorcentajeTipoPago * 0.1)

      console.log('Comisión calculada:', comision)

      const { data: comisionData, error: comisionError } = await supabase
        .from('comision')
        .insert({
          ventas_id_venta: selectedVenta.id,
          empleado_id_empleado: selectedVenta.worker_id_integer,
          monto_comision: comision,
          fecha_comision: new Date().toISOString()
        })
        .select()

      if (comisionError) {
        console.error('Error al insertar comisión:', comisionError)
        throw comisionError
      }

      console.log('Comisión insertada con éxito:', comisionData)

      setShowPaymentModal(false)
      fetchVentas()
      alert('Pago y comisión agregados con éxito.')
    } catch (error) {
      console.error('Error al agregar nuevo pago y comisión:', error)
      alert('Hubo un error al agregar el pago y la comisión. Por favor, inténtalo de nuevo.')
    }
  }

  const ventasFiltradas = ventas.filter(venta =>
    venta.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.service_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ventasActivas = ventasFiltradas.filter(venta => venta.is_active)
  const ventasInactivas = ventasFiltradas.filter(venta => !venta.is_active)

  const indexOfLastVentaActiva = currentPage * ventasPorPagina
  const indexOfFirstVentaActiva = indexOfLastVentaActiva - ventasPorPagina

  const indexOfLastVentaInactiva = currentPage * ventasPorPagina
  const indexOfFirstVentaInactiva = indexOfLastVentaInactiva - ventasPorPagina

  const pageNumbers = []
  for (let i = 1; i <= Math.ceil((ventasActivas.length + ventasInactivas.length) / ventasPorPagina); i++) {
    pageNumbers.push(i)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  const renderVentasTable = (ventas: Venta[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trabajador</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citas</th>
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
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(venta.price)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(venta.total_paid)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{venta.appointment_count}</td>
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
                  onClick={() => handleAddPayment(venta)} 
                  className="text-green-600 hover:text-green-900 flex items-center"
                >
                  <DollarSign size={20} className="mr-1" />
                  <span>Abonar</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

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

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={fetchVentas} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

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
            <Link href={userRole === 'admin' ? '/jefe' : '/trabajador'} className="text-white hover:text-gray-200 transition-colors flex items-center space-x-2">
              <Home size={24} />
              <span className="hidden sm:inline">Volver al Menú</span>
            </Link>
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

            {ventasActivas.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-green-600">Ventas con Citas Pendientes</h3>
                {renderVentasTable(ventasActivas.slice(indexOfFirstVentaActiva, indexOfLastVentaActiva))}
              </div>
            )}

            {ventasInactivas.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-600">Ventas sin Citas Pendientes</h3>
                {renderVentasTable(ventasInactivas.slice(indexOfFirstVentaInactiva, indexOfLastVentaInactiva))}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indexOfFirstVentaActiva + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastVentaActiva, ventasActivas.length + ventasInactivas.length)}
                  </span>{' '}
                  de <span className="font-medium">{ventasActivas.length + ventasInactivas.length}</span> resultados
                </p>
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Anterior</span>
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
                  <span className="sr-only">Siguiente</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </motion.div>
      </div>

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
                <p><span className="font-medium">Precio:</span> {formatCurrency(selectedVenta.price)}</p>
                <p><span className="font-medium">Total Pagado:</span> {formatCurrency(selectedVenta.total_paid)}</p>
                <p><span className="font-medium">Restante:</span> {formatCurrency(selectedVenta.price - selectedVenta.total_paid)}</p>
                <p><span className="font-medium">Número de Citas:</span> {selectedVenta.appointment_count}</p>
                <p><span className="font-medium">Descripción:</span> {selectedVenta.description}</p>
                <p><span className="font-medium">Próxima Cita:</span> {selectedVenta.next_appointment ? new Date(selectedVenta.next_appointment).toLocaleString() : 'No hay citas futuras'}</p>
                <p><span className="font-medium">Tipo de Pago:</span> {selectedVenta.tipo_pago ? selectedVenta.tipo_pago.name_comision : 'No especificado'}</p>
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
                <div>
                  <label htmlFor="id_tipo_pago" className="block text-sm font-medium text-gray-700">Tipo de Pago</label>
                  <select
                    id="id_tipo_pago"
                    value={selectedVenta.id_tipo_pago}
                    onChange={(e) => setSelectedVenta({...selectedVenta, id_tipo_pago: parseInt(e.target.value, 10)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {tiposPago.map((tipo) => (
                      <option key={tipo.id_tipo_pago} value={tipo.id_tipo_pago}>
                        {tipo.name_comision}
                      </option>
                    ))}
                  </select>
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

      <AnimatePresence>
        {showPaymentModal && selectedVenta && (
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
              <h3 className="text-lg font-medium mb-4">Agregar Pago</h3>
              <form onSubmit={handleNewPaymentSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Monto del Pago</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={newPayment.amount.toString()}
                    onChange={handleNewPaymentChange}
                    min="0"
                    step="1"
                    max={selectedVenta.price - selectedVenta.total_paid}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="id_tipo_pago" className="block text-sm font-medium text-gray-700">Tipo de Pago</label>
                  <select
                    id="id_tipo_pago"
                    name="id_tipo_pago"
                    value={newPayment.id_tipo_pago}
                    onChange={handleNewPaymentChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccione un tipo de pago</option>
                    {tiposPago.map((tipo) => (
                      <option key={tipo.id_tipo_pago} value={tipo.id_tipo_pago}>
                        {tipo.name_comision}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-gray-500">
                  Monto restante: {formatCurrency(selectedVenta.price - selectedVenta.total_paid)}
                </p>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Agregar Pago
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
