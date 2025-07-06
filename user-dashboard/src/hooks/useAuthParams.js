import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const useAuthParams = () => {
  const location = useLocation();

  // Use useMemo to parse query params only when location.search changes
  const queryParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const clientId = queryParams.get('client_id');
  const redirectUri = queryParams.get('redirect_uri');

  // A convenient flag to check if we are in a client-initiated flow
  const isClientFlow = !!clientId && !!redirectUri;

  return { clientId, redirectUri, isClientFlow };
};

export default useAuthParams;