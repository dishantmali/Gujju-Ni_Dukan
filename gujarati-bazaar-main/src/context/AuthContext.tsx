import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'buyer';
  profile?: { phone: string };
  addresses?: Array<{
    id: number;
    street: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
  }>;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterData | FormData) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'vendor' | 'buyer';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import api from '@/lib/api';
import { useCart } from '@/store/cart';

// API service for authentication using axios
const authAPI = {
  login: async (email: string, password: string) => {
    const data: any = await api.post('/auth/login/', { email, password });
    const { access, refresh } = data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return data;
  },
  
  register: async (userData: RegisterData | FormData) => {
    const isFormData = userData instanceof FormData;
    const data: any = await api.post('/auth/register/', userData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
    return data;
  },
  
  getCurrentUser: async () => {
    const data: any = await api.get('/auth/me/');
    return data;
  },
  
  refreshToken: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token');
    
    const data: any = await api.post('/auth/token/refresh/', { refresh });
    const { access } = data;
    localStorage.setItem('access_token', access);
    return access;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
          // Sync wishlist if the user is a buyer
          if (userData.role === 'buyer') {
            useCart.getState().syncWishlist();
            useCart.getState().syncCart();
          }
        }
      } catch (error) {
        // Token might be expired, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await authAPI.login(email, password);
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Sync wishlist if the user is a buyer
      if (userData.role === 'buyer') {
        await useCart.getState().mergeWishlist();
        await useCart.getState().mergeCart();
        useCart.getState().syncWishlist();
        useCart.getState().syncCart();
      }
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData | FormData) => {
    try {
      setIsLoading(true);
      await authAPI.register(userData);
      // Auto login after registration
      const email = userData instanceof FormData ? userData.get('email') : userData.email;
      const password = userData instanceof FormData ? userData.get('password') : userData.password;
      const loggedInUser = await login(email as string, password as string);
      return loggedInUser;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
