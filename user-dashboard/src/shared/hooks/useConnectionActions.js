import {useState, useMemo} from 'react';
import {useToast} from '@chakra-ui/react';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {useIdentityStore} from 'features/dashboard/store/identityStore';

import {deleteConnection} from 'shared/api/authService';
import {contextProviders} from 'shared/data/oauthProviders';

// The backend now uses a single, unified callback endpoint.
const REDIRECT_BASE_URI = 'http://localhost:8080/api/v1/auth/callback';

/**
 * Custom hook to handle connection and disconnection actions.
 * Centralizes the logic to be reused across different components.
 *
 * @returns {{
 * handleConnect: Function,
 * handleDisconnect: Function,
 * isDeleting: boolean,
 * }}
 */
export const useConnectionActions = () => {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const {accessToken} = useAuthenticationStore();
  const {fetchIdentityData} = useIdentityStore();

  const allProvidersFlat = useMemo(() => {
    return Object.values(contextProviders).flat();
  }, []);

  const handleConnect = (providerId) => {
    const providerConfig = allProvidersFlat.find(p => p.id === providerId);

    if (!providerConfig) {
      toast({
        title: 'Error',
        description: 'Provider configuration not found.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    const {clientId, authUrl, scopes, accessType} = providerConfig;
    const redirectUrl = `${REDIRECT_BASE_URI}?provider=${providerId}`;

    if (!clientId || clientId.startsWith('YOUR_')) {
      toast({
        title: 'Feature Coming Soon',
        description: `The ${providerId} login is not yet implemented.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    let oauthUrl = `${authUrl}?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}`;

    if (accessType) {
      oauthUrl += `&access_type=${accessType}`;
    }

    window.location.href = oauthUrl;
  };

  const handleDisconnect = async (providerId) => {
    setIsDeleting(true);
    try {
      await deleteConnection(accessToken, providerId);

      // Update the store state to remove the disconnected provider
      await fetchIdentityData(accessToken);

      toast({
        title: 'Connection Removed',
        description: 'The connection has been successfully removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error disconnecting provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove connection. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {handleConnect, handleDisconnect, isDeleting};
};
