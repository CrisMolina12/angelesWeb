import { UserCircle, Users } from "lucide-react";


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 flex flex-col items-center justify-start p-6">
      {/* Menú de navegación con imagen */}
      <header className="w-full bg-white py-4 shadow-lg mb-8 rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-between items-center">
            {/* Imagen del logo de la empresa */}
            <img
              src="/imagen1.png" // La imagen debe estar en la carpeta public como /public/logo.png
              alt="Logo de la Empresa"
              className="logo h-20 w-auto"
            />
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-lg w-full space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 drop-shadow-md">
            Bienvenido a nuestro portal
          </h1>
          <p className="text-lg text-gray-600">
            Elige tu rol para continuar
          </p>
        </div>
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden ring-1 ring-gray-200">
          <div className="p-8 space-y-10">
            <div className="hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-4 animate-fade-in">
                <Users className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-800">Trabajadores</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Accede a tus herramientas y recursos diarios.
              </p>
              <button className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
                Ingresar como trabajador
              </button>
            </div>
            <div className="border-t border-gray-200 pt-6 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center mb-4 animate-fade-in">
                <UserCircle className="h-8 w-8 text-pink-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-800">Jefes</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Gestiona tu equipo y revisa los informes.
              </p>
              <button className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-pink-500 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
                Ingresar como jefe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
