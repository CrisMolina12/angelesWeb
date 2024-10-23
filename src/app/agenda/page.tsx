'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import moment from 'moment';
import 'moment/locale/es';
import supabase from "../../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit2, Trash2, X, Check, Search, Calendar as CalendarIcon } from 'lucide-react';

moment.locale('es');

interface EventoCalendario {
  title: string | null;
  start: Date;
  end: Date;
  description: string | null;
  client_id: string | null;
  id: number;
  venta_id?: number;
}

function Header() {
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
      <CalendarIcon size={28} />
    </motion.header>
  );
}

export default function CalendarioCitas() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null);
  const [editableCita, setEditableCita] = useState<EventoCalendario | null>(null);
  const [currentDate, setCurrentDate] = useState(moment());
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEvents, setFilteredEvents] = useState<EventoCalendario[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchCitas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: citas, error: errorCitas } = await supabase
        .from("citas")
        .select(`*, ventas ( id, client_id )`)
        .order("service_date", { ascending: true });

      if (errorCitas) {
        throw errorCitas;
      }

      if (citas) {
        const eventosFormateados = citas.map((cita: any) => ({
          title: cita.description || 'Sin título',
          start: moment(`${cita.service_date} ${cita.start_time}`).toDate(),
          end: moment(`${cita.service_date} ${cita.end_time}`).toDate(),
          description: cita.description || 'Sin descripción',
          client_id: cita.ventas ? cita.ventas.client_id : "No disponible",
          id: cita.id,
          venta_id: cita.ventas ? cita.ventas.id : undefined,
        }));
        setEventos(eventosFormateados);
        setFilteredEvents(eventosFormateados);
      }
    } catch (error) {
      console.error("Error al obtener las citas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  useEffect(() => {
    const filtered = eventos.filter(event =>
      (event.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (event.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (event.client_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchTerm, eventos]);

  const handleSelectEvent = (event: EventoCalendario) => {
    setSelectedEvent(event);
    setEditableCita(null);
  };

  const handleEditClick = (event: EventoCalendario) => {
    setEditableCita(event);
    setSelectedEvent(null);
  };

  const handleDelete = async (id: number, ventaId?: number) => {
    try {
      const { error: citaError } = await supabase
        .from("citas")
        .delete()
        .eq("id", id);

      if (citaError) {
        throw citaError;
      }

      if (ventaId) {
        const { error: ventaError } = await supabase
          .from("ventas")
          .delete()
          .eq("id", ventaId);

        if (ventaError) {
          throw ventaError;
        }
      }

      await fetchCitas();
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error al eliminar la cita o venta:", error);
    }
  };

  const handleUpdate = async (updatedCita: EventoCalendario) => {
    try {
      const overlappingEvents = eventos.filter(event =>
        (event.start < updatedCita.end && updatedCita.start < event.end) &&
        event.id !== updatedCita.id
      );

      if (overlappingEvents.length > 0) {
        alert("La cita se solapa con otra existente. Por favor, elige otro horario.");
        return;
      }

      const { error } = await supabase
        .from("citas")
        .update({
          start_time: moment(updatedCita.start).format("HH:mm"),
          end_time: moment(updatedCita.end).format("HH:mm"),
          description: updatedCita.description,
          service_date: moment(updatedCita.start).format("YYYY-MM-DD"),
        })
        .eq("id", updatedCita.id);

      if (error) {
        throw error;
      }

      await fetchCitas();
      setEditableCita(null);
    } catch (error) {
      console.error("Error al actualizar la cita:", error);
    }
  };

  const changeDate = (delta: number) => {
    setCurrentDate(moment(currentDate).add(delta, view));
  };

  const renderCalendar = () => {
    switch (view) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return null;
    }
  };

  const renderMonthView = () => {
    return (
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 42 }, (_, i) => {
          const date = moment(currentDate).startOf('month').startOf('week').add(i, 'days');
          const isCurrentMonth = date.month() === currentDate.month();
          const isToday = date.isSame(moment(), 'day');
          const dayEvents = filteredEvents.filter(event => moment(event.start).isSame(date, 'day'));

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className={`p-2 rounded-lg ${isCurrentMonth ? 'bg-white' : 'bg-gray-100'} ${isToday ? 'border-2 border-purple-500' : ''} shadow-sm transition-all duration-300 hover:shadow-md`}
            >
              <div className={`text-right ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'} ${isToday ? 'font-bold' : ''}`}>
                {date.format('D')}
              </div>
              {dayEvents.slice(0, 3).map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="mt-1 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 truncate cursor-pointer"
                >
                  {event.title || 'Sin título'}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="mt-1 text-xs text-gray-500 text-center">
                  +{dayEvents.length - 3} más
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = moment(currentDate).startOf('week');
    const endOfWeek = moment(currentDate).endOf('week');
    const weekEvents = filteredEvents.filter(event => 
      moment(event.start).isBetween(startOfWeek, endOfWeek, null, '[]')
    );

    return (
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }, (_, i) => {
          const date = moment(startOfWeek).add(i, 'days');
          const isToday = date.isSame(moment(), 'day');
          const dayEvents = weekEvents.filter(event => moment(event.start).isSame(date, 'day'));

          return (
            <div key={i} className={`p-2 rounded-lg bg-white ${isToday ? 'border-2 border-purple-500' : ''} shadow-sm`}>
              <div className={`text-center ${isToday ? 'font-bold text-purple-600' : 'text-gray-700'}`}>
                {date.format('ddd D')}
              </div>
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="mt-1 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 truncate cursor-pointer"
                >
                  {moment(event.start).format('HH:mm')} - {event.title || 'Sin título'}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = filteredEvents.filter(event => 
      moment(event.start).isSame(currentDate, 'day')
    );

    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-center text-xl font-bold mb-4">
          {currentDate.format('dddd, D [de] MMMM')}
        </div>
        <div className="space-y-2">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleSelectEvent(event)}
              className="p-2 rounded-lg bg-purple-100 text-purple-800 cursor-pointer"
            >
              <div className="font-semibold">
                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
              </div>
              <div>{event.title || 'Sin título'}</div>
            </div>
          ))}
          {dayEvents.length === 0 && (
            <div className="text-center text-gray-500">No hay eventos para este día</div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 bg-white rounded-full shadow-2xl"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Calendario de Citas</h1>
              <div className="flex items-center space-x-4">
                <button onClick={() => changeDate(-1)} className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <span className="text-lg font-semibold text-gray-700">
                  {view === 'month' && currentDate.format('MMMM YYYY')}
                  {view === 'week' && `${currentDate.startOf('week').format('D MMM')} - ${currentDate.endOf('week').format('D MMM')}`}
                  {view === 'day' && currentDate.format('D [de] MMMM')}
                </span>
                <button onClick={() => changeDate(1)} className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar citas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300 text-lg shadow-sm"
                />
                <Search className="absolute left-4 top-3.5 text-gray-400" size={24} />
              </div>
            </div>

            <div className="mb-6 flex justify-center space-x-4">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-full ${view === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'} transition-colors`}
              >
                Mes
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-full ${view === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'} transition-colors`}
              >
                Semana
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-full ${view === 'day' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'} transition-colors`}
              >
                Día
              </button>
            </div>

            {renderCalendar()}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Detalles de la Cita</h2>
                <div className="space-y-3 mb-6">
                  <p><span className="font-medium text-purple-600">Inicio:</span> {moment(selectedEvent.start).format("LLL")}</p>
                  <p><span className="font-medium text-purple-600">Fin:</span> {moment(selectedEvent.end).format("LLL")}</p>
                  <p><span className="font-medium text-purple-600">Descripción:</span> {selectedEvent.description || 'Sin descripción'}</p>
                  <p><span className="font-medium text-purple-600">Cliente:</span> {selectedEvent.client_id || 'No disponible'}</p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition duration-300 flex items-center"
                    onClick={() => handleEditClick(selectedEvent)}
                  >
                    <Edit2 size={18} className="mr-2" />
                    Editar
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300 flex items-center"
                    onClick={() => handleDelete(selectedEvent.id, selectedEvent.venta_id)}
                  >
                    <Trash2 size={18} className="mr-2" />
                    Eliminar
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition duration-300 flex items-center"
                    onClick={() => setSelectedEvent(null)}
                  >
                    <X size={18} className="mr-2" />
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editableCita && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Editar Cita</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate(editableCita);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={editableCita.description || ''}
                      onChange={(e) => setEditableCita({ ...editableCita, description: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                    <input
                      type="datetime-local"
                      value={moment(editableCita.start).format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => setEditableCita({ ...editableCita, start: new Date(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                    <input
                      type="datetime-local"
                      value={moment(editableCita.end).format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => setEditableCita({ ...editableCita, end: new Date(e.target.value) })}
                      className="w-full border-2 border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-300"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition duration-300 flex items-center"
                    >
                      <Check size={18} className="mr-2" />
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition duration-300 flex items-center"
                      onClick={() => setEditableCita(null)}
                    >
                      <X size={18} className="mr-2" />
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}