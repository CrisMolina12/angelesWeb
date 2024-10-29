'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import supabase from "../../../lib/supabaseClient"
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, DollarSign, FileText, User, Check, X, Bell, Menu, LogOut, Package, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react'

type SaleFormData = {
  rut: string
  detalles: {
    servicioId: string
    cantidad: number | ''
    precio: number | ''
  }[]
  descripcion: string
  tipoPago: string
  servicioId: string
}

type ScheduleFormData = {
  fechaServicio: Date
  horaInicio: string
  horaFin: string
}

type Servicio = {
  id: string
  name_servicio: string
  estado_servicio_id: number
}

type ScheduledDate = {
  date: string
  count: number
}

type SaleSummary = {
  clientName: string
  rut: string
  servicios: {
    nombre: string
    cantidad: number
    precio: number
  }[]
  date: string
  startTime: string
  endTime: string
  total: number
  tipoPago: string
  abono: number
}

type TipoPago = {
  id_tipo_pago: number
  name_comision: string
  porcentaje: number
}

export default function RegistrarVenta() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rutsClientes, setRutsClientes] = useState<string[]>([])
  const [rutsFiltrados, setRutsFiltrados] = useState<string[]>([])
  const [idEmpleado, setIdEmpleado] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<'worker' | 'admin' | null>(null)
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    rut: '',
    detalles: [{ servicioId: '', cantidad: '', precio: '' }],
    descripcion: '',
    tipoPago: '',
    servicioId: ''
  })
  const [scheduleFormData, setScheduleFormData] = useState<ScheduleFormData>({
    fechaServicio: new Date(),
    horaInicio: '',
    horaFin: ''
  })
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null)
  const [step, setStep] = useState<'sale' | 'schedule' | 'summary'>('sale')
  const [ventaId, setVentaId] = useState<number | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [scheduledDates, setScheduledDates] = useState<ScheduledDate[]>([])
  const [saleSummary, setSaleSummary] = useState<SaleSummary | null>(null)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [abono, setAbono] = useState<number>(0)

  useEffect(() => {
    const initializeComponent = async () => {
      await verificarSesion()
      await obtenerRutsClientes()
      await obtenerServicios()
      await obtenerTiposPago()
      await fetchScheduledDates()
      setLoading(false)
    }

    initializeComponent()
  }, [router])

  useEffect(() => {
    fetchScheduledDates()
  }, [currentMonth])

  const verificarSesion = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    } else {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', session.user.email)
        .single()

      if (userError || !userData) {
        console.error('Error al obtener los datos del usuario:', userError)
        setMensaje({ tipo: 'error', texto: 'No se pueden determinar los datos del usuario.' })
        return
      }

      setIdEmpleado(userData.id)
      setUserRole(userData.role as 'worker' | 'admin')
    }
  }

  const obtenerRutsClientes = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('rut')
      if (error) throw error
      if (data) {
        setRutsClientes(data.map((cliente) => cliente.rut))
      }
    } catch (error) {
      console.error('Error al obtener los RUTs de los clientes:', error)
    }
  }

  const obtenerServicios = async () => {
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select('id, name_servicio, estado_servicio_id')
        .eq('estado_servicio_id', 1)

      if (error) throw error
      if (data) {
        setServicios(data)
      }
    } catch (error) {
      console.error('Error al obtener los servicios:', error)
    }
  }

  const obtenerTiposPago = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_pago')
        .select('*')

      if (error) throw error
      if (data) {
        setTiposPago(data)
      }
    } catch (error) {
      console.error('Error al obtener los tipos de pago:', error)
    }
  }

  const fetchScheduledDates = async () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    try {
      const { data, error } = await supabase
        .from('citas')
        .select('service_date')
        .gte('service_date', startOfMonth.toISOString())
        .lte('service_date', endOfMonth.toISOString())

      if (error) throw error
      if (data) {
        const countedDates = data.reduce((acc, { service_date }) => {
          acc[service_date] = (acc[service_date] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        setScheduledDates(Object.entries(countedDates).map(([date, count]) => ({ date, count })))
      }
    } catch (error) {
      console.error('Error al obtener las fechas agendadas:', error)
    }
  }

  const handleSaleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: string } }, index?: number) => {
    const { name, value } = e.target
    if (index !== undefined && name !== 'rut' && name !== 'descripcion' && name !== 'tipoPago') {
      const newDetalles = [...saleFormData.detalles]
      if (name === 'cantidad') {
        const cantidad = parseInt(value)
        newDetalles[index] = { ...newDetalles[index], [name]: isNaN(cantidad) ? 0 : cantidad }
      } else if (name === 'precio') {
        const precio = parseFloat(value)
        newDetalles[index] = { ...newDetalles[index], [name]: isNaN(precio) ? 0 : precio }
      } else if (name === 'servicioId') {
        newDetalles[index] = { ...newDetalles[index], [name]: value }
      } else {
        newDetalles[index] = { ...newDetalles[index], [name]: value }
      }
      setSaleFormData(prev => ({ ...prev, detalles: newDetalles }))
    } else if (name === 'abono') {
      setAbono(parseFloat(value) || 0)
    } else if (name === 'servicioId') {
      setSaleFormData(prev => ({ ...prev, servicioId: value }))
    } else {
      setSaleFormData(prev => ({ ...prev, [name]: value }))
    }

    if (name === 'rut') {
      setRutsFiltrados(value ? rutsClientes.filter(rut => rut.startsWith(value)) : [])
    }
  }

  const calcularComision = (abono: number, tipoPagoId: number) => {
    const tipoPagoSeleccionado = tiposPago.find(tipo => tipo.id_tipo_pago === tipoPagoId)
    if (tipoPagoSeleccionado) {
      const montoConPorcentajeTipoPago = abono * (1 - tipoPagoSeleccionado.porcentaje / 100)
      return Math.round(montoConPorcentajeTipoPago * 0.1) // 10% de la comisión después de aplicar el porcentaje del tipo de pago, redondeado
    }
    return 0
  }

  const handleAddDetail = () => {
    setSaleFormData(prev => ({
      ...prev,
      detalles: [...prev.detalles, { servicioId: '', cantidad: '', precio: '' }]
    }))
  }

  const handleRemoveDetail = (index: number) => {
    setSaleFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }))
  }

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (idEmpleado === null) {
      setMensaje({ tipo: 'error', texto: 'No se puede registrar la venta sin un empleado autenticado.' })
      return
    }

    if (!rutsClientes.includes(saleFormData.rut)) {
      setMensaje({ tipo: 'error', texto: 'El RUT ingresado no está registrado. Por favor, registre al cliente.' })
      return
    }

    try {
      const total = saleFormData.detalles.reduce((sum, detalle) => {
        const precio = parseInt(detalle.precio as string) || 0;
        return sum + precio;
      }, 0);

      const tipoPagoId = parseInt(saleFormData.tipoPago)
      const comisionCalculada = calcularComision(abono, tipoPagoId)

      const { data: datosVenta, error: errorVenta } = await supabase.from('ventas').insert({
        client_id: saleFormData.rut,
        worker_id_integer: idEmpleado,
        price: total,
        description: saleFormData.descripcion,
        id_tipo_pago: tipoPagoId,
        fecha_transaccion: new Date().toISOString(),
        servicio_id: saleFormData.detalles[0].servicioId
      }).select('*').single()

      if (errorVenta) throw errorVenta

      if (datosVenta && datosVenta.id) {
        await insertSaleDetails(datosVenta.id)
        if (abono > 0) {
          await supabase.from('abono').insert({
            ventas_id_venta: datosVenta.id,
            cantidad_abonada: abono,
            fecha_abono: new Date().toISOString(),
            id_tipo_pago: tipoPagoId
          })
        }

        await supabase.from('comision').insert({
          ventas_id_venta: datosVenta.id,
          empleado_id_empleado: idEmpleado,
          monto_comision: comisionCalculada,
          fecha_comision: new Date().toISOString()
        })

        setVentaId(datosVenta.id)
        setStep('schedule')
        setMensaje({ tipo: 'exito', texto: 'Venta registrada con éxito. Ahora, agende la cita.' })
      } else {
        console.error('Venta insertada pero ID no encontrado:', datosVenta)
        throw new Error('ID de venta no encontrado en la respuesta')
      }
    } catch (error) {
      console.error('Error al registrar la venta:', error)
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error al registrar la venta.' })
    }
  }

  const insertSaleDetails = async (ventaId: number | string) => {
    try {
      console.log('Insertando detalles de venta con ID:', ventaId)
      const detallesVenta = saleFormData.detalles.map(detalle => ({
        ventas_id_venta: ventaId,
        servicio_id: detalle.servicioId,
        cant_sesiones: parseInt(detalle.cantidad as string) || 0
      }))

      const { error } = await supabase.from('detalle_venta').insert(detallesVenta)
      if (error) throw error
    } catch (error) {
      console.error('Error al insertar los detalles de la venta:', error)
      throw error
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ventaId === null) {
      setMensaje({ tipo: 'error', texto: 'No se puede agendar la cita sin una venta asociada.' })
      return
    }

    try {
      const { error: errorCita } = await supabase.from('citas').insert({
        venta_id: ventaId,
        service_date: scheduleFormData.fechaServicio.toISOString().split('T')[0],
        start_time: scheduleFormData.horaInicio,
        end_time: scheduleFormData.horaFin,
        description: saleFormData.descripcion,
      })

      if (errorCita) throw errorCita

      await createSaleSummary()
      setStep('summary')
      setMensaje({ tipo: 'exito', texto: '¡La cita ha sido agendada con éxito!' })
    } catch (error) {
      console.error('Error al agendar la cita:', error)
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error al agendar la cita.' })
    }
  }

  const createSaleSummary = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        
        .from('clients')
        .select('name')
        .eq('rut', saleFormData.rut)
        .single()

      if (clientError) throw clientError

      const serviciosVenta = await Promise.all(saleFormData.detalles.map(async (detalle) => {
        const { data: servicioData, error: servicioError } = await supabase
          .from('servicios')
          .select('name_servicio')
          .eq('id', detalle.servicioId)
          .single()

        if (servicioError) throw servicioError

        return {
          nombre: servicioData.name_servicio,
          cantidad: parseInt(detalle.cantidad as string) || 0,
          precio: parseFloat(detalle.precio as string) || 0
        }
      }))

      const total = serviciosVenta.reduce((sum, servicio) => sum + servicio.precio, 0);
      setSaleSummary({
        clientName: clientData.name,
        rut: saleFormData.rut,
        servicios: serviciosVenta,
        date: scheduleFormData.fechaServicio.toLocaleDateString(),
        startTime: scheduleFormData.horaInicio,
        endTime: scheduleFormData.horaFin,
        total: Math.round(total),
        tipoPago: tiposPago.find(tipo => tipo.id_tipo_pago === parseInt(saleFormData.tipoPago))?.name_comision || 'Desconocido',
        abono: Math.round(abono)
      })
    } catch (error) {
      console.error('Error al crear el resumen de la venta:', error)
      setMensaje({ tipo: 'error', texto: 'Error al crear el resumen de la venta.' })
    }
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split('T')[0]
      const isSelected = date.toDateString() === scheduleFormData.fechaServicio.toDateString()
      const scheduledDate = scheduledDates.find(sd => sd.date === dateString)
      const isScheduled = !!scheduledDate

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`p-2 rounded-full hover:bg-purple-100 transition-colors relative ${
            isSelected ? 'bg-purple-500 text-white' : ''
          } ${isScheduled ? 'bg-yellow-100' : ''}`}
        >
          {day}
          {isScheduled && (
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500 rounded-full"></span>
          )}
        </button>
      )
    }

    return days
  }

  const handleDateClick = (date: Date) => {
    setScheduleFormData(prev => ({ ...prev, fechaServicio: date }))
    setShowTimeModal(true)
  }

  const handleTimeSelection = (e: React.FormEvent) => {
    e.preventDefault()
    setShowTimeModal(false)
  }

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleVolverAlMenu = () => {
    if (userRole === 'admin') {
      router.push('/jefe')
    } else {
      router.push('/trabajador')
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="px-6 py-8 sm:p-10">
            <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-900">
              {step === 'sale' ? 'Registrar Nueva Venta' : step === 'schedule' ? 'Agendar Cita' : 'Resumen de Venta y Cita'}
            </h2>
            <AnimatePresence>
              {mensaje && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-6 p-4 rounded-lg ${
                    mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="flex items-center">
                    {mensaje.tipo === 'exito' ? (
                      <Check className="w-5 h-5 mr-2" />
                    ) : (
                      <X className="w-5 h-5 mr-2" />
                    )}
                    <p className="font-medium">{mensaje.texto}</p>
                  </div>
                  {mensaje.tipo === 'error' && step === 'sale' && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 transition duration-300 underline"
                      onClick={() => router.push('/cliente')}
                    >
                      Registrar nuevo cliente
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {step === 'sale' && (
              <form onSubmit={handleSaleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">RUT del cliente</label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="rut"
                      name="rut"
                      value={saleFormData.rut}
                      onChange={handleSaleInputChange}
                      onFocus={() => setRutsFiltrados(rutsClientes)}
                      onBlur={() => setTimeout(() => setRutsFiltrados([]), 200)}
                      required
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                      placeholder="Ingrese RUT del cliente"
                    />
                  </div>
                  <AnimatePresence>
                    {rutsFiltrados.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto"
                      >
                        <ul>
                          {rutsFiltrados.map((rutFiltrado) => (
                            <motion.li 
                              key={rutFiltrado}
                              whileHover={{ backgroundColor: "#F3F4F6" }}
                              className="px-4 py-2 cursor-pointer transition duration-150 ease-in-out"
                              onClick={() => setSaleFormData(prev => ({ ...prev, rut: rutFiltrado }))}
                            >
                              {rutFiltrado}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {saleFormData.detalles.map((detalle, index) => (
                  <div key={index} className="space-y-4">
                    <div>
                      <label htmlFor={`servicioId-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                      <div className="relative">
                        <Package className="absolute top-3 left-3 text-gray-400" size={20} />
                        <select
                          id={`servicioId-${index}`}
                          name="servicioId"
                          value={detalle.servicioId}
                          onChange={(e) => handleSaleInputChange(e, index)}
                          required
                          className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                        >
                          <option value="">Seleccione un servicio</option>
                          {servicios.map((servicio) => (
                            <option key={servicio.id} value={servicio.id}>
                              {servicio.name_servicio}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label htmlFor={`cantidad-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input
                          type="number"
                          id={`cantidad-${index}`}
                          name="cantidad"
                          value={detalle.cantidad}
                          onChange={(e) => handleSaleInputChange(e, index)}
                          required
                          min="0"
                          className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`precio-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                        <div className="relative">
                          <DollarSign className="absolute top-3 left-3 text-gray-400" size={20} />
                          <input
                            type="text"
                            id={`precio-${index}`}
                            name="precio"
                            value={detalle.precio === 0 ? '' : `$${Number(detalle.precio).toLocaleString('es-CL')}`}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              handleSaleInputChange({ target: { name: 'precio', value } }, index);
                            }}
                            required
                            className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                            placeholder="$0"
                          />
                        </div>
                      </div>
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(index)}
                        className="text-red-600 hover:text-red-800 transition duration-300"
                      >
                        <Minus size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300 flex items-center justify-center"
                >
                  <Plus size={20} className="mr-2" /> Agregar otro servicio
                </button>
                <div>
                  <label htmlFor="tipoPago" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
                  <select
                    id="tipoPago"
                    name="tipoPago"
                    value={saleFormData.tipoPago}
                    onChange={handleSaleInputChange}
                    required
                    className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                  >
                    <option value="">Seleccione un tipo de pago</option>
                    {tiposPago.map((tipo) => (
                      <option key={tipo.id_tipo_pago} value={tipo.id_tipo_pago}>
                        {tipo.name_comision}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="abono" className="block text-sm font-medium text-gray-700 mb-1">Abono</label>
                  <div className="relative">
                    <DollarSign className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="abono"
                      name="abono"
                      value={abono === 0 ? '' : `$${Number(abono).toLocaleString('es-CL')}`}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        handleSaleInputChange({ target: { name: 'abono', value } });
                      }}
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                      placeholder="$0"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <div className="relative">
                    <FileText className="absolute top-3 left-3 text-gray-400" size={20} />
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      value={saleFormData.descripcion}
                      onChange={handleSaleInputChange}
                      rows={3}
                      className="pl-10 w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                      placeholder="Ingrese una descripción"
                    ></textarea>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 flex items-center justify-center"
                >
                  <DollarSign size={20} className="mr-2" />
                  Registrar Venta
                </motion.button>
              </form>
            )}
            {step === 'schedule' && (
              <form onSubmit={handleScheduleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={prevMonth} className="text-purple-600 hover:text-purple-800">
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-lg font-semibold">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button type="button" onClick={nextMonth} className="text-purple-600 hover:text-purple-800">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="font-medium text-gray-500">{day}</div>
                    ))}
                    {renderCalendar()}
                  </div>
                </div>
                <AnimatePresence>
                  {showTimeModal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                      <motion.div
                        initial={{ y: -50 }}
                        animate={{ y: 0 }}
                        className="bg-white p-6 rounded-lg shadow-xl"
                      >
                        <h3 className="text-lg font-semibold mb-4">Seleccionar Hora</h3>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 mb-1">Hora de Inicio</label>
                            <input
                              type="time"
                              id="horaInicio"
                              name="horaInicio"
                              value={scheduleFormData.horaInicio}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                              required
                              className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                            />
                          </div>
                          <div>
                            <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 mb-1">Hora de Fin</label>
                            <input
                              type="time"
                              id="horaFin"
                              name="horaFin"
                              value={scheduleFormData.horaFin}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, horaFin: e.target.value }))}
                              required
                              className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowTimeModal(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleTimeSelection}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
                          >
                            Confirmar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora Seleccionadas</label>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-lg font-semibold">
                      {scheduleFormData.fechaServicio.toLocaleDateString()} - {scheduleFormData.horaInicio} a {scheduleFormData.horaFin}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 flex items-center justify-center"
                >
                  <Calendar size={20} className="mr-2" />
                  Agendar Cita
                </motion.button>
              </form>
            )}
            {step === 'summary' && saleSummary && (
              <div className="space-y-6">
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Resumen de la Venta y Cita</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Cliente:</span> {saleSummary.clientName}</p>
                    <p><span className="font-medium">RUT:</span> {saleSummary.rut}</p>
                    <p><span className="font-medium">Servicios:</span></p>
                    <ul className="list-disc list-inside pl-4">
                      {saleSummary.servicios.map((servicio, index) => (
                        <li key={index}>
                          {servicio.nombre} - Cantidad: {servicio.cantidad}, Precio: ${servicio.precio.toLocaleString('es-CL')}
                        </li>
                      ))}
                    </ul>
                    <p><span className="font-medium">Fecha:</span> {saleSummary.date}</p>
                    <p><span className="font-medium">Hora:</span> {saleSummary.startTime} - {saleSummary.endTime}</p>
                    <p><span className="font-medium">Total:</span> ${saleSummary.total.toLocaleString('es-CL')} CLP</p>
                    <p><span className="font-medium">Tipo de Pago:</span> {saleSummary.tipoPago}</p>
                    <p><span className="font-medium">Abono:</span> ${saleSummary.abono.toLocaleString('es-CL')} CLP</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVolverAlMenu}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center"
                  >
                    Volver al Menú
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSaleFormData({
                        rut: '',
                        detalles: [{ servicioId: '', cantidad: '', precio: '' }],
                        descripcion: '',
                        tipoPago: '',
                        servicioId: ''
                      })
                      setScheduleFormData({
                        fechaServicio: new Date(),
                        horaInicio: '',
                        horaFin: ''
                      })
                      setAbono(0)
                      setStep('sale')
                      setMensaje(null)
                    }}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 flex items-center justify-center"
                  >
                    Nueva Venta
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}