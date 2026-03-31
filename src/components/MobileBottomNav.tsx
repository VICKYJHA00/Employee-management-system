import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Bell, MessageSquare, Settings, ScanLine } from 'lucide-react';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Bell, label: 'Alerts', path: '/dashboard/notifications' },
    { icon: ScanLine, label: 'Attendance', path: '/dashboard/attendance' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-2 py-1 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex justify-around items-end">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                active ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;