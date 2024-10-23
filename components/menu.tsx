import { useState } from "react";
import Link from "next/link";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <a className="text-white font-bold text-xl">Logo</a>
        </Link>
        <button
          onClick={toggleMenu}
          className="text-white block md:hidden focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
        <div
          className={`${
            isOpen ? "block" : "hidden"
          } md:flex md:items-center w-full md:w-auto`}
        >
          <ul className="md:flex space-y-2 md:space-y-0 md:space-x-4">
            <li>
              <Link href="/">
                <a className="text-white block">Inicio</a>
              </Link>
            </li>
            <li>
              <Link href="/about">
                <a className="text-white block">Acerca de</a>
              </Link>
            </li>
            <li>
              <Link href="/services">
                <a className="text-white block">Servicios</a>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <a className="text-white block">Contacto</a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
