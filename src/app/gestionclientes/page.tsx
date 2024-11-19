'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import supabase from "../../../lib/supabaseClient"
import { Edit2, Trash2, Search, Plus, Home } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface Cliente {
  id: string
  name: string
  phone: string
  rut: string
}

function Header({ userRole }: { userRole: string }) {
  const homeLink = userRole === 'admin' ? '/jefe' : '/trabajador'

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
        <Link href={homeLink} className="text-white hover:text-gray-200 transition-colors flex items-center space-x-2">
          <Home size={24} />
          <span className="hidden sm:inline">Volver al Menú</span>
        </Link>
      </div>
    </motion.header>
  )
}

const GestionClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editedCliente, setEditedCliente] = useState<Cliente | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const router = useRouter()

  const fetchClientes = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from("clients").select("*")

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error("No se recibieron datos al obtener los clientes.")
      }

      setClientes(data)
    } catch (error) {
      console.error("Error al obtener los clientes:", error)
      setError("Error al cargar los clientes. Por favor, intente de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!session) {
          router.push("/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single()

        if (userError) {
          throw userError
        }

        setUserRole(userData.role)
      } catch (error) {
        console.error("Error al obtener la sesión del usuario:", error)
        setError("Error de autenticación. Por favor, inicie sesión de nuevo.")
        router.push("/login")
      }
    }

    checkUser()
    fetchClientes()
  }, [router])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (cliente: Cliente) => {
    setEditedCliente(cliente)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id)

      if (error) {
        throw error
      }

      await fetchClientes()
    } catch (error) {
      console.error("Error al eliminar el cliente:", error)
      setError("Error al eliminar el cliente. Por favor, intente de nuevo.")
    }
  }

  const handleUpdate = async () => {
    if (!editedCliente) return;

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: editedCliente.name,
          phone: editedCliente.phone,
          rut: editedCliente.rut
        })
        .eq("id", editedCliente.id);

      if (error) {
        throw error;
      }

      setEditedCliente(null);
      await fetchClientes();
    } catch (error) {
      console.error("Error al actualizar el cliente:", error);
      setError("Error al actualizar el cliente. Por favor, intente de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <Header userRole={userRole} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-6 sm:p-10">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Gestión de Clientes</h1>

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

            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              <Link href="/cliente" passHref>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(167, 139, 250, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition duration-300 flex items-center justify-center shadow-md"
                >
                  <Plus className="mr-2" size={20} />
                  Agregar Cliente
                </motion.button>
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-500 py-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                Cargando clientes...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Teléfono</th>
                      <th className="px-4 py-3 text-left">RUT</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((cliente) => (
                      <motion.tr
                        key={cliente.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="border px-4 py-2">{cliente.name}</td>
                        <td className="border px-4 py-2">{cliente.phone}</td>
                        <td className="border px-4 py-2">{cliente.rut}</td>
                        <td className="border px-4 py-2 text-center">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="text-blue-600 hover:text-blue-800 transition duration-200 mr-4"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="text-red-600 hover:text-red-800 transition duration-200"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editedCliente && (
              <div className="mt-8 p-6 bg-gray-100 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Editar Cliente</h2>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={editedCliente.name}
                  onChange={(e) => setEditedCliente({ ...editedCliente, name: e.target.value })}
                  className="mb-4 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={editedCliente.phone}
                  onChange={(e) => setEditedCliente({ ...editedCliente, phone: e.target.value })}
                  className="mb-4 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="RUT"
                  value={editedCliente.rut}
                  onChange={(e) => setEditedCliente({ ...editedCliente, rut: e.target.value })}
                  className="mb-4 p-2 border rounded"
                />
                <button 
                  onClick={handleUpdate}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Guardar Cambios
                </button>
                <button 
                  onClick={() => setEditedCliente(null)}
                  className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default GestionClientes