import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Shield,
  Database,
  Bell,
  BarChart3,
  LogOut,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Events', href: '/events', icon: Calendar },

  { name: 'Moderation', href: '/moderation', icon: Shield },
  { name: 'Backup & Export', href: '/backup-export', icon: Database },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 min-h-screen flex flex-col fixed inset-y-0 z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        {/* Brand */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 p-0.5">
              <div className="bg-white rounded-lg w-full h-full flex items-center justify-center">
                <img src="/icon.png" alt="FemVents" className="w-8 h-8 rounded-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-600 bg-clip-text text-transparent tracking-tight">FemVents</h1>
              <p className="text-xs text-gray-500 font-medium">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
            Main Menu
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-secondary-600 shadow-sm border border-secondary-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {item.name}
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center text-secondary-700 font-bold border-2 border-white shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-72">
        <main className="p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
