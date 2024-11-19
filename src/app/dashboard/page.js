'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../../lib/supabaseClient'
import { LogOut, Home, PlusCircle } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-lg"
    >
      <div className="flex items-center space-x-4">
        <Image
          src="/Imagen1.png" 
          alt="Logo de Angeles"
          width={48}
          height={48}
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
      <nav className="flex items-center space-x-6">
        <Link href="/jefe" className="text-white hover:text-gray-200 transition-colors flex items-center space-x-2">
          <Home size={24} />
          <span className="hidden sm:inline">Inicio</span>
        </Link>
      </nav>
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

  useEffect(() => {
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

    fetchUserRole()
  }, [router])

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
        throw new Error('No se pudo crear el usuario.')
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
                <label className="block mb-2 text-sm text-gray-600">Rol:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-12 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-purple-600"
                >
                  <option value="worker">Trabajador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {successMessage && (
                <div className="text-green-600">{successMessage}</div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <PlusCircle className="mr-2" size={20} />
                Crear Usuario
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}