import { useSharedContext } from '../contexts/SharedContext';

export const useAuth = () => {
  const { authContext } = useSharedContext();
  return authContext;
};
