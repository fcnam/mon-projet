import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Package, FileText, BarChart3, Settings, Radio as RadioIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/systems', icon: Radio, label: 'Systèmes' },
    { to: '/equipments', icon: Package, label: 'Équipements' },
    { to: '/procedures', icon: FileText, label: 'Procédures' },
    { to: '/statistics', icon: BarChart3, label: 'Statistiques' },
  ];

  if (isAdmin()) {
    navItems.push({ to: '/admin', icon: Settings, label: 'Administration' });
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white flex flex-col">
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center space-x-3">
          <RadioIcon className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">AIBVS</h1>
            <p className="text-xs text-primary-200">CCR Casablanca</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-100 hover:bg-primary-700/50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-primary-700">
        <div className="text-xs text-primary-300 text-center">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2025 CCR Casa</p>
        </div>
      </div>
    </aside>
  );
}
