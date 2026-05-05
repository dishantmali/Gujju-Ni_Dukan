import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const useAuthWithNavigate = () => {
  const { login, register, logout, user } = useAuth();
  const navigate = useNavigate();

  const loginWithNavigate = async (email: string, password: string) => {
    await login(email, password);
    
    // Wait a tick for state to update
    setTimeout(() => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else if (currentUser.role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/account');
      }
    }, 100);
  };

  const registerWithNavigate = async (userData: any) => {
    await register(userData);
    
    // Wait a tick for state to update
    setTimeout(() => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else if (currentUser.role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/account');
      }
    }, 100);
  };

  const logoutWithNavigate = () => {
    logout();
    navigate('/login');
  };

  return {
    login: loginWithNavigate,
    register: registerWithNavigate,
    logout: logoutWithNavigate,
    user
  };
};
