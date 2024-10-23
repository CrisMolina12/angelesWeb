
export default function Unauthorized() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">403 - Acceso Denegado</h1>
          <p className="mt-4 text-lg text-gray-600">No tienes permisos para acceder a esta página.</p>
          <a href="/login" className="mt-4 text-blue-500 hover:underline">Volver al inicio de sesión</a>
        </div>
      </div>
    );
  }
  