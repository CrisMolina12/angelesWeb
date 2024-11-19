'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import supabase from "../../../lib/supabaseClient"
import { motion } from 'framer-motion'
import { Edit, Save, Trash2, Plus, Home } from 'lucide-react'

type PaymentType = {
  id_tipo_pago: number
  name_comision: string
  porcentaje: number
}

function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-8 rounded-2xl"
    >
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Image
          src="/Imagen1.png" 
          alt="Logo de Angeles"
          width={40}
          height={40}
          className="rounded-full border-2 border-white shadow-md"
        />
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg sm:text-2xl font-bold tracking-wide"
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

export default function PaymentTypesTable() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingType, setEditingType] = useState<number | null>(null)
  const [newPaymentType, setNewPaymentType] = useState<Omit<PaymentType, 'id_tipo_pago'>>({ name_comision: '', porcentaje: 0 })
  const [isAddingNew, setIsAddingNew] = useState(false)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !userData || userData.role !== 'admin') {
      router.push('/autorizacion')
      return
    }

    setIsAuthenticated(true)
    setIsAdmin(true)
    fetchPaymentTypes()
  }, [router])

  const fetchPaymentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_pago')
        .select('*')
        .order('id_tipo_pago', { ascending: true })

      if (error) throw error

      if (data) {
        setPaymentTypes(data)
      }
    } catch (error) {
      console.error('Error al obtener los tipos de pago:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleEdit = (id: number) => {
    setEditingType(id)
  }

  const handleSave = async (id: number) => {
    const paymentType = paymentTypes.find(pt => pt.id_tipo_pago === id)
    if (!paymentType) return

    try {
      const { error } = await supabase
        .from('tipo_pago')
        .update({
          name_comision: paymentType.name_comision,
          porcentaje: paymentType.porcentaje
        })
        .eq('id_tipo_pago', id)

      if (error) throw error

      setEditingType(null)
      fetchPaymentTypes()
    } catch (error) {
      console.error('Error al actualizar el tipo de pago:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este tipo de pago?')) {
      try {
        const { error } = await supabase
          .from('tipo_pago')
          .delete()
          .eq('id_tipo_pago', id)

        if (error) throw error

        fetchPaymentTypes()
      } catch (error) {
        console.error('Error al eliminar el tipo de pago:', error)
      }
    }
  }

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('tipo_pago')
        .insert([
          {
            name_comision: newPaymentType.name_comision,
            porcentaje: newPaymentType.porcentaje
          }
        ])

      if (error) throw error

      setNewPaymentType({ name_comision: '', porcentaje: 0 })
      setIsAddingNew(false)
      fetchPaymentTypes()
    } catch (error) {
      console.error('Error al agregar el tipo de pago:', error)
    }
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Tipos de Pago</h1>
              <button
                onClick={() => setIsAddingNew(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              >
                <Plus className="mr-2" size={20} />
                <span>Agregar Tipo de Pago</span>
              </button>
            </div>
            {isAddingNew && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Tipo de Pago</h2>
                <div className="flex flex-wrap -mx-3 mb-4">
                  <div className="w-full md:w-1/2 px-3 mb-4 md:mb-0">
                    <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="new-name">
                      Nombre
                    </label>
                    <input
                      className="appearance-none block w-full bg-white text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      id="new-name"
                      type="text"
                      placeholder="Nombre del tipo de pago"
                      value={newPaymentType.name_comision}
                      onChange={(e) => setNewPaymentType({ ...newPaymentType, name_comision: e.target.value })}
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-3">
                    <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="new-percentage">
                      Porcentaje
                    </label>
                    <input
                      className="appearance-none block w-full bg-white text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      id="new-percentage"
                      type="number"
                      placeholder="Porcentaje"
                      value={isNaN(newPaymentType.porcentaje) ? '' : newPaymentType.porcentaje.toString()}
                      onChange={(e) => {
                        const value = e.target.value === '' ? NaN : parseFloat(e.target.value);
                        setNewPaymentType({ ...newPaymentType, porcentaje: value });
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAdd}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Porcentaje</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTypes.map((paymentType) => (
                    <tr key={paymentType.id_tipo_pago} className="border-b hover:bg-gray-100">
                      <td className="py-3 px-4">{paymentType.id_tipo_pago}</td>
                      <td className="py-3 px-4">
                        {editingType === paymentType.id_tipo_pago ? (
                          <input
                            type="text"
                            value={paymentType.name_comision}
                            onChange={(e) => setPaymentTypes(types =>
                              types.map(t => t.id_tipo_pago === paymentType.id_tipo_pago ? { ...t, name_comision: e.target.value } : t)
                            )}
                            className="w-full p-1 border rounded"
                          />
                        ) : (
                          paymentType.name_comision
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingType === paymentType.id_tipo_pago ? (
                          <input
                            type="number"
                            value={isNaN(paymentType.porcentaje) ? '' : paymentType.porcentaje.toString()}
                            onChange={(e) => setPaymentTypes(types =>
                              types.map(t => t.id_tipo_pago === paymentType.id_tipo_pago ? { ...t, porcentaje: parseFloat(e.target.value) } : t)
                            )}
                            className="w-full p-1 border rounded"
                          />
                        ) : (
                          `${paymentType.porcentaje}%`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingType === paymentType.id_tipo_pago ? (
                          <button
                            onClick={() => handleSave(paymentType.id_tipo_pago)}
                            className="text-green-600 hover:text-green-800 mr-2"
                          >
                            <Save size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(paymentType.id_tipo_pago)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(paymentType.id_tipo_pago)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}