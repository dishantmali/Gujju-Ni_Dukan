import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const useAuthWithNavigate = () => {
  const { login, register, logout, user } = useAuth();
  const navigate = useNavigate();

  const navigateByRole = (currentUser: typeof user) => {
    if (currentUser?.role === 'admin') {
      navigate('/admin');
    } else if (currentUser?.role === 'vendor') {
      navigate('/vendor/dashboard');
    } else {
      navigate('/account');
    }
  };

  const loginWithNavigate = async (email: string, password: string) => {
    const currentUser = await login(email, password);
    navigateByRole(currentUser);
  };

  const registerWithNavigate = async (userData: any) => {
    const currentUser = await register(userData);
    navigateByRole(currentUser);
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
