import { useNavigate, useLocation } from 'react-router-dom';

export const useNavigateToCalculator = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    const token = localStorage.getItem('userToken');
    const targetRoute = token ? '/dashboard' : '/';

    if (location.pathname === targetRoute) {
      document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate(targetRoute);
    setTimeout(() => {
      document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };
};
