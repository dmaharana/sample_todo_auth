import React, { useEffect, useState } from 'react';
import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ListTodo, Users, ChevronLeft, ChevronRight, User, Sun, Moon } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface ContextType {
  userRole: string;
  username: string;
}

const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to light, will be updated from API
  const { userRole, username } = useOutletContext<ContextType>();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const fetchTheme = async () => {
      const response = await apiRequest<{ value: string }>('/user-preferences/theme', 'GET');
      if (response.data && (response.data.value === 'light' || response.data.value === 'dark')) {
        setTheme(response.data.value);
      } else {
        // Fallback to system preference if no theme is saved
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    };
    fetchTheme();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const response = await apiRequest('/user-preferences', 'POST', { key: 'theme', value: newTheme });
    if (response.data) {
      setTheme(newTheme);
    } else if (response.error) {
      console.error('Failed to save theme preference:', response.error);
    }
  };

  return (
    <div className="flex h-screen">
      <aside className={`relative h-full border-r bg-muted/40 p-4 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        {!isCollapsed && <h2 className="text-lg font-semibold mb-4">Navigation</h2>}
        
        <nav className="flex-grow">
          <ul className="space-y-2">
            <li>
              <Link to="/app">
                <Button variant="ghost" className="w-full justify-start">
                  <ListTodo className={`mr-2 h-4 w-4 ${isCollapsed ? 'mr-0' : ''}`} />
                  {!isCollapsed && "Todo App"}
                </Button>
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/users">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className={`mr-2 h-4 w-4 ${isCollapsed ? 'mr-0' : ''}`} />
                    {!isCollapsed && "User Management"}
                  </Button>
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <User className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
              {!isCollapsed && <span className="text-sm font-medium">{username}</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="w-full"
          >
            {!isCollapsed && "Logout"}
            {isCollapsed && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
      <main className="flex-grow p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

