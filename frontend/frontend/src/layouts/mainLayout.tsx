import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// 简单的 Icons (实际项目中可使用 lucide-react 或 heroicons)
const IconTree = () => <span>🌳</span>;
const IconChat = () => <span>💬</span>;
const IconLogout = () => <span>🚪</span>;

export const MainLayout: React.FC = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight">NoteTree.ai</h1>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1">
          <NavLink to="/" className={navClass} data-testid="nav-tree">
            <IconTree />
            <span className="font-medium">Knowledge Graph</span>
          </NavLink>
          <NavLink to="/chat" className={navClass} data-testid="nav-chat">
            <IconChat />
            <span className="font-medium">AI Assistant</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-medium text-gray-900 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            data-testid="btn-logout"
          >
            <IconLogout />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};