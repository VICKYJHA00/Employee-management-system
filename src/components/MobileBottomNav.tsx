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
    <div>
      <div className="flex justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={active ? 'text-blue-500' : 'text-gray-500'}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;