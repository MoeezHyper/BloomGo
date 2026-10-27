import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { homeFor } from '@/lib/constants';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? homeFor(user.role) : '/welcome'} />;
}
