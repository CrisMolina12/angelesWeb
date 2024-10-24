'use client'

import React, { useState, useEffect } from 'react'
import supabase from "../../../lib/supabaseClient"
import { motion } from 'framer-motion'
import { Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Abono = {
  id: number
  cantidad_abonada: number
  fecha_abono: string
}

type Comision = {
  id_comision: number
  ventas_id_venta: number
  empleado_id_empleado: number
  monto_comision: number
  fecha_comision: string
  empleado_name?: string
  venta_total?: number
  tipo_pago?: string
  porcentaje_comision?: number
  abonos: Abono[]
}

export default function Component() {
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<number[]>([])

  useEffect(() => {
    fetchComisiones()
  }, [])

  const fetchComisiones = async () => {
    try {
      const { data, error } = await supabase
        .from('comision')
        .select(`
          *,
          empleado:empleado_id_empleado(name),
          venta:ventas_id_venta(
            id,
            price,
            tipo_pago(name_comision, porcentaje),
            abono(id, cantidad_abonada, fecha_abono)
          )
        `)
        .order('fecha_comision', { ascending: false })

      if (error) throw error

      if (data) {
        const comisionesFormateadas = data.map((comision) => ({
          id_comision: comision.id_comision,
          ventas_id_venta: comision.ventas_id_venta,
          empleado_id_empleado: comision.empleado_id_empleado,
          monto_comision: comision.monto_comision,
          fecha_comision: comision.fecha_comision,
          empleado_name: comision.empleado?.name,
          venta_total: comision.venta?.price,
          tipo_pago: comision.venta?.tipo_pago?.name_comision,
          porcentaje_comision: comision.venta?.tipo_pago?.porcentaje,
          abonos: comision.venta?.abono || []
        }))

        setComisiones(comisionesFormateadas)
      }
    } catch (error) {
      console.error('Error al obtener las comisiones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: number) => {
    // Implementar lógica para editar comisión
    console.log('Editar comisión:', id)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta comisión?')) {
      try {
        const { error } = await supabase
          .from('comision')
          .delete()
          .eq('id_comision', id)

        if (error) throw error

        setComisiones(comisiones.filter(comision => comision.id_comision !== id))
      } catch (error) {
        console.error('Error al eliminar la comisión:', error)
      }
    }
  }

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tabla de Comisiones</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left"></th>
              <th className="py-3 px-4 text-left">ID Comisión</th>
              <th className="py-3 px-4 text-left">ID Venta</th>
              <th className="py-3 px-4 text-left">Empleado</th>
              <th className="py-3 px-4 text-left">Venta Total</th>
              <th className="py-3 px-4 text-left">Tipo de Pago</th>
              <th className="py-3 px-4 text-left">% Comisión</th>
              <th className="py-3 px-4 text-left">Comisión Total</th>
              <th className="py-3 px-4 text-left">Fecha Comisión</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comisiones.map((comision) => (
              <React.Fragment key={comision.id_comision}>
                <tr className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">
                    <button onClick={() => toggleRowExpansion(comision.id_comision)}>
                      {expandedRows.includes(comision.id_comision) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                  <td className="py-3 px-4">{comision.id_comision}</td>
                  <td className="py-3 px-4">{comision.ventas_id_venta}</td>
                  <td className="py-3 px-4">{comision.empleado_name}</td>
                  <td className="py-3 px-4">${comision.venta_total?.toLocaleString('es-CL')}</td>
                  <td className="py-3 px-4">{comision.tipo_pago}</td>
                  <td className="py-3 px-4">{comision.porcentaje_comision}%</td>
                  <td className="py-3 px-4">${comision.monto_comision.toLocaleString('es-CL')}</td>
                  <td className="py-3 px-4">{new Date(comision.fecha_comision).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEdit(comision.id_comision)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(comision.id_comision)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
                {expandedRows.includes(comision.id_comision) && (
                  <tr>
                    <td colSpan={10}>
                      <div className="p-4 bg-gray-50">
                        <h4 className="font-semibold mb-2">Abonos:</h4>
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="py-2 px-4 text-left">ID Abono</th>
                              <th className="py-2 px-4 text-left">Cantidad Abonada</th>
                              <th className="py-2 px-4 text-left">Fecha Abono</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comision.abonos.map((abono) => (
                              <tr key={abono.id}>
                                <td className="py-2 px-4">{abono.id}</td>
                                <td className="py-2 px-4">${abono.cantidad_abonada.toLocaleString('es-CL')}</td>
                                <td className="py-2 px-4">{new Date(abono.fecha_abono).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}