import { Link } from '@tanstack/react-router'
import { LogIn, Menu, UserPlus, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  {
    to: '/',
    label: 'Home',
  },
  {
    to: '/auth/register',
    label: 'Create account',
    icon: <UserPlus size={18} />,
  },
  {
    to: '/auth/login',
    label: 'Sign in',
    icon: <LogIn size={18} />,
  },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-900 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="text-xl font-semibold flex items-center gap-3">
          <img
            src="/tanstack-circle-logo.png"
            alt="Codezoo"
            className="h-10 w-10 rounded-full border border-white/20"
          />
          <span>Codezoo</span>
        </Link>
        <div className="hidden md:flex items-center gap-3">
          {navLinks.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-2"
              activeProps={{
                className:
                  'px-4 py-2 rounded-lg bg-cyan-400 text-black transition-colors flex items-center gap-2',
              }}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-950 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Navigate</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 transition-colors"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-black hover:bg-cyan-500 transition-colors',
              }}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
