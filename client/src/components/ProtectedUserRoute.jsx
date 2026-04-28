import { Navigate } from 'react-router-dom';

export default function ProtectedUserRoute({ children }) {
  const token = localStorage.getItem('userToken');
  if (!token) return <Navigate to="/signup" replace />;
  return children;
}
