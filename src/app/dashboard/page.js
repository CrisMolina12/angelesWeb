'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../../lib/supabaseClient'
import { UserPlus, Users, LogOut, Bell, Menu } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md mb-6 rounded-lg"
    >
      <div className="flex items-center space-x-2">
        <Image
          src="/Imagen1.png" 
          alt="Logo de Angeles"
          width={32}
          height={32}
          className="rounded-full border border-white shadow-sm"
        />
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg font-bold tracking-wide"
        >
          Angeles
        </motion.span>
      </div>
      <div className="flex items-center space-x-2">
        <button className="text-white hover:text-gray-200 transition-colors p-1">
          <Bell size={25} />
        </button>
        <button className="text-white hover:text-gray-200 transition-colors p-1">
          <Menu size={20} />
        </button>
      </div>
    </motion.header>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('worker')
  const [name, setName] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  const fetchUserRole = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
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

    setUserRole(userData.role)
    setLoading(false)
  }

  useEffect(() => {
    fetchUserRole()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (userRole !== 'admin') {
    router.push('/autorizacion')
    return null
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setSuccessMessage('')

    try {
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)

      if (fetchError) {
        throw new Error(`Error al verificar usuario: ${fetchError.message}`)
      }

      if (existingUsers.length > 0) {
        throw new Error('El correo electrónico ya está registrado.')
      }

      await delay(1000)

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: null,
          data: { name, role },
        }
      })

      if (signUpError) {
        if (signUpError.status === 429) {
          throw new Error('Límite de solicitudes alcanzado. Por favor, inténtelo de nuevo más tarde.')
        } else {
          throw new Error(`Error al crear usuario: ${signUpError.message}`)
        }
      }

      if (signUpData && signUpData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ email, role, name }])

        if (insertError) {
          throw new Error(`Error al insertar usuario en la tabla: ${insertError.message}`)
        }

        setSuccessMessage('Usuario creado exitosamente.')
        setEmail('')
        setPassword('')
        setName('')
      } else {
        throw new Error('No se pudo crear el  usuario.')
      }
    } catch (error) {
      console.error('Error:', error.message)
      alert(error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl rounded-2xl overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Panel de Admin</h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="text-purple-600 hover:text-purple-800 flex items-center transition-colors duration-300"
              >
                <LogOut className="h-6 w-6 mr-2" />
                Cerrar sesión
              </motion.button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre"
                  className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-purple-600"
                  required
                />
                <label className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-3 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Nombre</label>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-purple-600"
                  required
                />
                <label className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-3 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Email</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="peer placeholder-transparent h-12 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-purple-600"
                  required
                />
                <label className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-3 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Contraseña</label>
              </div>
              <div className="relative">
                <label className="block mb-2 text-gray-700">Rol del usuario</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border-b-2 border-gray-300 text-gray-900 h-12 px-3 focus:outline-none focus:border-purple-600"
                  required
                >
                  <option value="worker">Trabajador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Crear Usuario
              </motion.button>
              {successMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-500 text-center"
                >
                  {successMessage}
                </motion.p>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}