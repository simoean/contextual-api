import React, {useMemo, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {
  Box,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Container,
  Image,
  useColorMode,
  IconButton,
  Tooltip,
  Button,
  VStack,
  HStack,
  Link
} from '@chakra-ui/react';

import {MoonIcon, SunIcon} from '@chakra-ui/icons';

import logo from 'assets/images/logo.png';
import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {useIdentityStore} from "features/dashboard/store/identityStore";
import {useConnectionActions} from 'shared/hooks/useConnectionActions';
import {contextProviders} from 'shared/data/oauthProviders';

/**
 * Connect Data Sources Page Component
 * This component is shown to a new user after successful registration.
 * It prompts them to connect social accounts to import data and
 * populate their initial contexts and attributes.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const ConnectDatasourcesPage = () => {
  const navigate = useNavigate();

  // Read the connectedProviders state from the authentication store
  const {connectedProviders, accessToken, selectedContextId, setSelectedContextId} = useAuthenticationStore();
  // Get contexts from the identity store
  const {contexts, fetchIdentityData, isLoaded} = useIdentityStore();

  // Use the new custom hook for connection logic
  const {handleConnect} = useConnectionActions();

  // Color mode and styling
  const {colorMode, toggleColorMode} = useColorMode();
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const fullPageBg = useColorModeValue('gray.50', 'gray.800');

  // Fetch contexts from the backend and set the default one
  useEffect(() => {
    if (accessToken && !isLoaded) {
      fetchIdentityData(accessToken);
    }
  }, [accessToken, fetchIdentityData, isLoaded]);

  useEffect(() => {
    if (contexts.length > 0 && !selectedContextId) {
      // Find the "Personal" context and set its ID as the default
      const defaultContext = contexts.find(c => c.name === 'Personal');
      if (defaultContext) {
        setSelectedContextId(defaultContext.id);
      }
    }
  }, [contexts, selectedContextId, setSelectedContextId]);

  // Create a mapping from context ID to name for the UI
  const contextsMap = useMemo(() => {
    return contexts.reduce((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {});
  }, [contexts]);

  // Find the providers for the currently selected context
  const selectedContextName = contextsMap[selectedContextId];
  const providersForSelectedContext = contextProviders[selectedContextName] || [];

  // Check if any providers have been connected
  const hasConnectedProviders = connectedProviders.length > 0;

  /**
   * Handles the "Skip" or "Continue" action, redirecting the user to the dashboard.
   */
  const handleContinue = () => {
    fetchIdentityData(accessToken).then(r => navigate('/dashboard'));
  };

  return (
    <Box minH="100vh" minW="100vw" bg={fullPageBg} py={8}>
      <Container
        maxW="600px"
        mx="auto"
        bg={cardBg}
        boxShadow={'lg'}
        rounded={'lg'}
        borderWidth="1px"
        borderColor={cardBorderColor}
        position="relative"
      >
        <Stack spacing={8} py={12} px={6}>
          {/* Theme toggle fixed to the container's top-right corner */}
          <Box position="absolute" top={4} right={4}>
            <Tooltip label="Toggle Color Mode">
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                size="md"
              />
            </Tooltip>
          </Box>

          <Stack align={'center'} my={4}>
            <Image src={logo} alt="Contextual Identity API" boxSize="150px" mb={8} borderRadius="15%" p={2}/>
            <Heading fontSize={'2xl'} textAlign={'center'}>Populate your account</Heading>
            <Text fontSize={'lg'} textAlign="center">
              Connect social accounts to import data and get started quickly.
            </Text>
          </Stack>

          {/* Updated button group for contexts */}
          <HStack justifyContent="center" spacing={2} mt={4}>
            {contexts.map((context) => (
              <Button
                key={context.id}
                variant={selectedContextId === context.id ? 'solid' : 'outline'}
                colorScheme={selectedContextId === context.id ? 'brand' : 'gray'}
                onClick={() => setSelectedContextId(context.id)}
                justifyContent="center"
                px={4}
                py={6}
                height="auto"
                whiteSpace="normal"
                flex="1 1 auto"
                minWidth="120px"
                maxWidth="200px"
              >
                {context.name}
              </Button>
            ))}
          </HStack>

          <VStack spacing={4} w="90%" mx="auto" mt={4}>
            {providersForSelectedContext.map((provider) => (
              <Button
                key={provider.id}
                leftIcon={provider.icon}
                width="full"
                onClick={() => handleConnect(provider.id, selectedContextId)}
                backgroundColor={provider.color}
                color="white"
                _hover={{backgroundColor: provider.color}}
                isDisabled={connectedProviders.includes(provider.id)}
              >
                {connectedProviders.includes(provider.id) ? `${provider.name} Connected` : `Connect with ${provider.name}`}
              </Button>
            ))}
          </VStack>

          <HStack spacing={4} mt={8} justifyContent="center" w="100%">
            <Link as={Button} onClick={handleContinue} variant="ghost" colorScheme="brand">
              {hasConnectedProviders ? 'Continue to Dashboard' : 'Skip for now'}
            </Link>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
};

export default ConnectDatasourcesPage;
