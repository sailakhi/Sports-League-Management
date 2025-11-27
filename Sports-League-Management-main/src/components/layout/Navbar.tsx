import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, BarChart3, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    const baseItems = [
      { id: 'standings', label: 'Standings', icon: BarChart3 },
      { id: 'matches', label: 'Matches', icon: Calendar },
      { id: 'teams', label: 'Teams', icon: Users },
    ];

    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Trophy },
        ...baseItems,
        { id: 'leagues', label: 'Leagues', icon: Trophy },
      ];
    }

    if (user?.role === 'coach') {
      return [
        { id: 'dashboard', label: 'My Team', icon: Users },
        ...baseItems,
      ];
    }

    if (user?.role === 'player') {
      return [
        { id: 'dashboard', label: 'Profile', icon: Users },
        ...baseItems,
      ];
    }

    return baseItems;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Sports League</span>
            </div>
            
            <div className="hidden md:flex space-x-4">
              {getNavItems().map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user.name}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {user.role}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;