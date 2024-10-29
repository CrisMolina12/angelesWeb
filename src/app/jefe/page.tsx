'use client'

import { useEffect, useState } from 'react'
import { Users, Calendar, DollarSign, UserPlus, BarChart2, FileText, LogOut, Bell, Menu, Briefcase, Eye, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import supabase from '../../../lib/supabaseClient'

function Header({ onLogout }: { onLogout: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
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
                onClick={() => {
                  setIsMenuOpen(false)
                  onLogout()
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <LogOut className="inline-block mr-2 h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}

function ActionCard({ title, description, icon, link }: {
  title: string
  description: string
  icon: React.ReactNode
  link: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <Link href={link} className="block h-full">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full">
            {icon}
          </div>
          <h2 className="text-xl font-semibold ml-4 text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600">{description}</p>
      </Link>
    </motion.div>
  )
}

export default function Dashboard() {
  const [userName, setUserName] = useState('')
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user || !user.email) {
        window.location.href = '/login'
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, name')
        .eq('email', user.email)
        .single()

      if (userError || !userData) {
        window.location.href = '/login'
        return
      }

      setUserName(userData.name)
      setRole(userData.role)
    }

    fetchUserRole()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      window.location.href = '/login'
    }
  }

  if (role === null) {
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

  if (role !== 'admin' && role !== 'worker') {
    window.location.href = '/autorizacion'
    return null
  }

  const commonCards = [
    {
      title: "Registrar Venta",
      description: "Ingresar una nueva venta o servicio realizado.",
      icon: <DollarSign className="h-8 w-8 text-white" />,
      link: "/ventas"
    },
    {
      title: "Gestión de Clientes",
      description: "Administrar información y datos de los clientes.",
      icon: <Users className="h-8 w-8 text-white" />,
      link: "/gestionclientes"
    },
    {
      title: "Registro de Clientes",
      description: "Ver y analizar la base de datos de clientes.",
      icon: <UserPlus className="h-8 w-8 text-white" />,
      link: "/cliente"
    },
    {
      title: "Agenda",
      description: "Ver y gestionar citas y tareas.",
      icon: <Calendar className="h-8 w-8 text-white" />,
      link: "/agenda"
    },
    {
      title: "Agregar Citas",
      description: "Programar nuevas citas para los clientes.",
      icon: <Clock className="h-8 w-8 text-white" />,
      link: "/citas"
    }
  ]

  const adminCards = [
    {
      title: "Gestión de Trabajadores",
      description: "Administrar información y rendimiento de los empleados.",
      icon: <Users className="h-8 w-8 text-white" />,
      link: "/admworker"
    },
    {
      title: "Reportes",
      description: "Generar y ver reportes detallados del negocio.",
      icon: <BarChart2 className="h-8 w-8 text-white" />,
      link: "/reporte"
    },
    {
      title: "Comisiones",
      description: "Calcular y gestionar comisiones de los trabajadores.",
      icon: <FileText className="h-8 w-8 text-white" />,
      link: "/comision"
    },
    {
      title: "Crear usuarios",
      description: "Crear usuarios dependiendo de su rol",
      icon: <UserPlus className="h-8 w-8 text-white" />,
      link: "/dashboard"
    },
    {
      title: "Gestión de Servicios",
      description: "Administrar y actualizar los servicios ofrecidos.",
      icon: <Briefcase className="h-8 w-8 text-white" />,
      link: "/servicio"
    },
    {
      title: "Ver ventas activas",
      description: "Mira las ventas que estan activas e inactivas.",
      icon: <Eye className="h-8 w-8 text-white" />,
      link: "/verventas"
    }
  ]

  const cards = role === 'admin' ? [...commonCards, ...adminCards] : commonCards

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header onLogout={handleLogout} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Bienvenido, {userName}
              </h1>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout} 
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-full hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-2"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </motion.button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards.map((card, index) => (
                <ActionCard 
                  key={index}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  link={card.link}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}