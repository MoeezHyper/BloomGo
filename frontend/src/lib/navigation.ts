import type { useRouter } from 'expo-router';
import { homeFor } from './constants';
import type { User } from './types';

// After creating an account: go home, then open the role's setup screen (skippable).
export function goHomeAfterSignUp(router: ReturnType<typeof useRouter>, user: User) {
  router.replace(homeFor(user.role));
  if (user.role === 'customer') setTimeout(() => router.push({ pathname: '/settings/garden', params: { onboarding: '1' } }), 350);
  else if (user.role !== 'admin') setTimeout(() => router.push({ pathname: '/settings/professional', params: { onboarding: '1' } }), 350);
}
