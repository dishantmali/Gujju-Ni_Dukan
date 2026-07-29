import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const useAuthWithNavigate = () => {
  const { login, register, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigateByRole = (currentUser: typeof user) => {
    const from = (location.state as any)?.from;
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const target = from || redirectParam;

    if (currentUser?.role === 'admin') {
      navigate('/admin');
    } else if (currentUser?.role === 'vendor') {
      navigate('/vendor/dashboard');
    } else if (target) {
      navigate(target, { replace: true });
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
