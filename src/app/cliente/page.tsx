'use client'

import { useState, useEffect } from 'react'
import supabase from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, LogOut, UserPlus, Phone, CreditCard, Check, X } from 'lucide-react'

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg rounded-2xl"
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

export default function RegisterClient() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [rut, setRut] = useState('')
  const [role, setRole] = useState(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = async () => {
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
        router.push('/login')
        return
      }

      if (userData.role !== 'admin' && userData.role !== 'worker') {
        router.push('/danger/unauthorized')
        return
      }

      setRole(userData.role)
    }

    checkUserRole()
  }, [router])

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const { data: existingClients, error: fetchError } = await supabase
        .from('clients')
        .select('rut')
        .eq('rut', rut)

      if (fetchError) {
        throw new Error(`Error al verificar cliente: ${fetchError.message}`)
      }

      if (existingClients.length > 0) {
        setMessage({ type: 'error', text: 'El cliente ya está registrado.' })
        return
      }

      const { error: insertError } = await supabase
        .from('clients')
        .insert([{ name, phone, rut }])

      if (insertError) {
        throw new Error(`Error al insertar cliente en la tabla: ${insertError.message}`)
      }

      setMessage({ type: 'success', text: 'Cliente registrado exitosamente.' })
      setName('')
      setPhone('')
      setRut('')
    } catch (error) {
      console.error('Error inesperado:', error)
      setMessage({ type: 'error', text: 'Error inesperado. Por favor, inténtelo de nuevo más tarde.' })
    }
  }

  if (role === null) {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="px-6 py-8 sm:p-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center rounded-full shadow-lg">
                <UserPlus size={40} />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Registrar Nuevo Cliente
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 max-w-sm mx-auto">
                Ingrese los datos del nuevo cliente para registrarlo en nuestro sistema de gestión.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleRegisterClient}>
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-lg ${
                      message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <div className="flex items-center">
                      {message.type === 'success' ? (
                        <Check className="w-5 h-5 mr-2" />
                      ) : (
                        <X className="w-5 h-5 mr-2" />
                      )}
                      <p className="font-medium">{message.text}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="Nombre completo"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rut" className="block text-sm font-medium text-gray-700">
                    RUT
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="rut"
                      name="rut"
                      type="text"
                      required
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="12.345.678-9"
                    />
                  </div>
                </div>
              </div>

              <div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(167, 139, 250, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300 ease-in-out"
                >
                  Registrar Cliente
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}