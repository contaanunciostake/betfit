import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  CreditCard, 
  Tags, 
  Settings, 
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Server
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral e métricas'
  },
  {
    title: 'Usuários',
    href: '/users',
    icon: Users,
    description: 'Gestão de usuários'
  },
  {
    title: 'Desafios',
    href: '/challenges',
    icon: Trophy,
    description: 'Gestão de desafios'
  },
  {
    title: 'Pagamentos',
    href: '/payments',
    icon: CreditCard,
    description: 'Gestão de pagamentos'
  },
  {
    title: 'Categorias',
    href: '/categories',
    icon: Tags,
    description: 'Gestão de categorias'
  },
  {
    title: 'Instalação VPS',
    href: '/installation',
    icon: Server,
    description: 'Deploy automatizado'
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
    description: 'Configurações do sistema'
  },
  {
    title: 'Logs',
    href: '/logs',
    icon: FileText,
    description: 'Logs e auditoria'
  }
]

export default function AdminSidebar({ open, onToggle }) {
  const location = useLocation()

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300",
      open ? "w-64" : "w-16"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {open && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">BetFit Admin</h2>
              <p className="text-xs text-slate-400">Painel Administrativo</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                isActive 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-green-400" : "text-slate-400 group-hover:text-white"
              )} />
              
              {open && (
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-green-400" : "text-slate-300 group-hover:text-white"
                  )}>
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.description}
                  </p>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {open && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">
            <p>BetFit Admin v1.0</p>
            <p>© 2024 BetFit</p>
          </div>
        </div>
      )}
    </div>
  )
}

