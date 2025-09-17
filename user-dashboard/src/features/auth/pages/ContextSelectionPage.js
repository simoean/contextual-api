import React, {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Tooltip,
  Spinner,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';

import {MoonIcon, SunIcon} from '@chakra-ui/icons';
import logo from 'assets/images/logo.webp';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {useIdentityStore} from 'features/dashboard/store/identityStore';

import useAuthParams from 'shared/hooks/useAuthParams';
import {truncateText} from "shared/util/text";

import {recordConsent, fetchConsents} from 'shared/api/authService';

/**
 * Context Selection Page
 * This component allows users to select a context and attributes to share with a client application during the
 * authentication process.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const ContextSelectionPage = () => {

  // Hooks for navigation, location, and toast notifications
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Hooks for accessing contexts, attributes, and authentication state
  const {contexts, attributes, fetchIdentityData, isLoading: dataLoading, error: storeError} = useIdentityStore();

  // Authentication store for managing selected context and attributes
  const {
    userInfo,
    accessToken,
    isAuthenticated,
    isLoading: authLoading,
    selectedContextId,
    selectedAttributeIds,
    setSelectedContextId,
    toggleSelectedAttributeId,
    resetSelection,
    setSelectedAttributeIds
  } = useAuthenticationStore();

  const {colorMode, toggleColorMode} = useColorMode();

  // Local state for API call loading and error
  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [userConsents, setUserConsents] = useState([]);

  // Corrected color definitions for header/footer and main card background
  const headerFooterBg = useColorModeValue('gray.100', 'gray.700');
  const headerFooterBorderColor = useColorModeValue('gray.200', 'gray.600');
  const appNameColor = useColorModeValue('brand.500', 'brand.300');
  const mainCardBg = useColorModeValue('white', 'gray.800');
  const mainCardBorderColor = useColorModeValue('gray.200', 'gray.600');

  // Define attribute HStack background at the top level
  const attributeHStackBg = useColorModeValue('gray.100', 'gray.700');

  const popupWidth = "600px";

  // Use the existing hook to get auth parameters
  const {clientId, redirectUri} = useAuthParams();


  /**
   * Fetch Identity Data
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated && accessToken && contexts.length === 0 && attributes.length === 0) {
      console.log("ContextSelectionPage: Fetching identity data.");
      fetchIdentityData(accessToken);
    }
  }, [accessToken, isAuthenticated, authLoading, fetchIdentityData, contexts.length, attributes.length]);

  /**
   * Fetch user consents on component load
   */
  useEffect(() => {
    const fetchUserConsents = async () => {
      if (accessToken) {
        try {
          const consents = await fetchConsents(accessToken);
          setUserConsents(consents);
        } catch (error) {
          console.error("Failed to fetch user consents:", error);
        }
      }
    };
    fetchUserConsents();
  }, [accessToken]);

  /**
   * Handle Authentication Status
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("ContextSelectionPage: Not authenticated, redirecting to sign in.");
      navigate('/auth', {state: {from: location.pathname}});
    }
  }, [authLoading, isAuthenticated, navigate, location.pathname]);

  const selectedContext = useMemo(() => {
    return contexts.find(ctx => ctx.id === selectedContextId);
  }, [selectedContextId, contexts]);

  const filteredAttributes = useMemo(() => {
    if (!selectedContextId) {
      return [];
    }
    return attributes.filter(attr =>
      Array.isArray(attr.contextIds) &&
      attr.contextIds.includes(selectedContextId) &&
      attr.visible
    );
  }, [selectedContextId, attributes]);

  /**
   * Effect to initialize selected attributes when a context is selected
   */
  useEffect(() => {
    if (selectedContextId) {
      // Get all the visible attribute IDs for the newly selected context
      const attributesForContext = attributes
        .filter(attr => attr.contextIds?.includes(selectedContextId) && attr.visible)
        .map(attr => attr.id);
      // Set them as the selected attributes
      setSelectedAttributeIds(attributesForContext);
    } else {
      // If no context is selected, clear the attributes
      setSelectedAttributeIds([]);
    }
    // Only run this effect when the selected context ID changes
  }, [selectedContextId, attributes, setSelectedAttributeIds]);

  /**
   * Handle Context Button Click
   */
  const handleContextButtonClick = (contextId) => {
    setSelectedContextId(contextId);
  };

  /**
   * Handle Cancel Action
   */
  const handleCancel = () => {
    resetSelection();
    if (window.opener) {
      window.opener.postMessage({type: 'CONTEXT_AUTH_CANCEL'}, window.location.origin);
    }
    window.close();
  };

  /**
   * Handle Share Checkbox Change
   */
  const handleShareCheckboxChange = (attributeId) => {
    toggleSelectedAttributeId(attributeId);
  };

  /**
   * Handle Confirm Selection
   * New logic: Instead of sending data directly, it calls the backend to record consent.
   */
  const handleConfirmSelection = async () => {
    // Check if a client ID is present; it's required for consent
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID not found in URL. Cannot record consent.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSavingConsent(true);

    try {
      // Step 1: Find the existing consent for this client to preserve the token validity
      const existingConsent = userConsents.find(consent => consent.clientId === clientId);
      // Use the existing validity, or a default value if none is found
      const tokenValidity = existingConsent?.tokenValidity || 'ONE_DAY';

      // Step 2: Call the service function to record the consent with the determined validity
      await recordConsent(accessToken, clientId, selectedContextId, selectedAttributeIds, tokenValidity);

      // Step 3: On success, signal to the opener window that authentication is complete
      // We no longer send the attributes, just the token
      if (window.opener && redirectUri) {
        window.opener.postMessage({
          type: 'CONTEXT_AUTH_SUCCESS',
          payload: {
            token: accessToken,
            userId: userInfo?.userId,
            username: userInfo?.username
          }
        }, redirectUri);
        window.close();
      } else {
        console.warn("No opener window found. Cannot send authentication data.");
        toast({
          title: "Authentication successful, but window communication failed.",
          description: "The consent has been recorded.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Failed to record consent:", error);
      toast({
        title: "Consent recording failed.",
        description: "An error occurred while saving your consent. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingConsent(false);
      resetSelection();
    }
  };

  // Conditional Render for loading state
  if (authLoading || dataLoading) {
    return (
      <Container centerContent height="100vh" display="flex" flexDirection="column" justifyContent="center"
                 alignItems="center"
                 variant="fullPageBackground"
      >
        <Spinner size="xl" color="brand.500"/>
        <Text mt={4}>Loading contexts and attributes...</Text>
      </Container>
    );
  }

  // Conditional Render for error state
  if (storeError) {
    return (
      <Container centerContent height="100vh" display="flex" flexDirection="column" justifyContent="center"
                 alignItems="center"
                 variant="fullPageBackground"
      >
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center"
               textAlign="center" py={8}>
          <AlertIcon boxSize="40px" mr={0}/>
          <Heading as="h2" size="lg" mt={4} mb={2}>Error Loading Data</Heading>
          <Text>{storeError}</Text>
        </Alert>
      </Container>
    );
  }

  // Conditional Render for unauthenticated users
  if (!isAuthenticated || !accessToken) {
    return (
      <Container centerContent height="100vh" display="flex" flexDirection="column" justifyContent="center"
                 alignItems="center"
                 variant="fullPageBackground"
      >
        <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center"
               textAlign="center" py={8}>
          <AlertIcon boxSize="40px" mr={0}/>
          <Heading as="h2" size="lg" mt={4} mb={2}>Authentication Required</Heading>
          <Text>Please sign in to access context selection.</Text>
        </Alert>
      </Container>
    );
  }

  /**
   * Render the Context Selection Page
   */
  return (
    <Container
      minW={popupWidth}
      maxW={popupWidth}
      height="100vh"
      p={0}
      display="flex"
      flexDirection="column"
      bg={mainCardBg}
      boxShadow={'lg'}
      rounded={'lg'}
      borderWidth="1px"
      borderColor={mainCardBorderColor}
    >
      <HStack
        as="header"
        width="100%"
        px={4}
        py={4}
        bg={headerFooterBg}
        justifyContent="space-between"
        alignItems="center"
        borderBottom="1px solid"
        borderColor={headerFooterBorderColor}
      >
        <HStack spacing={3}>
          <Image src={logo} alt="App Logo" boxSize="40px" borderRadius="15%"/>
          <Heading as="h1" size="md" color={appNameColor}>
            Contextual Identity API
          </Heading>
        </HStack>
        <Tooltip label="Toggle Color Mode">
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="md"
          />
        </Tooltip>
      </HStack>

      <VStack
        spacing={6}
        p={6}
        flex="1"
        overflowY="auto"
        alignItems="flex-start"
      >
        <VStack align="flex-start" spacing={1}>
          <Heading as="h2" size="xl">
            Welcome, <Text as="span" color="blue.400">{userInfo?.username || 'User'}</Text>!
          </Heading>
          <Text fontSize="lg" variant="subtitle">
            Please select a context to proceed:
          </Text>
        </VStack>

        <VStack align="stretch" spacing={3} width="100%">
          <Heading as="h3" size="md" mt={4}>Your Contexts:</Heading>
          {contexts.length > 0 ? (
            <Flex
              wrap="wrap"
              gap={3}
              justifyContent="flex-start"
              width="100%"
            >
              {contexts.map((context) => (
                <Button
                  data-testid={`context-button-${context.id}`}
                  key={context.id}
                  variant={selectedContextId === context.id ? 'selectedContext' : 'unselectedContext'}
                  onClick={() => handleContextButtonClick(context.id)}
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
            </Flex>
          ) : (
            <Text>No contexts found for your user.</Text>
          )}
        </VStack>

        {selectedContext && (
          <VStack align="stretch" spacing={4} width="100%" mt={6}>
            <Heading data-testid="attributes-heading" as="h3" size="md">Attributes for "{selectedContext.name}" Context:</Heading>
            <Text fontSize="sm" variant="subtitle">
              Select attributes to share with the client application:
            </Text>
            {dataLoading ? (
              <Spinner size="md"/>
            ) : filteredAttributes.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {filteredAttributes.map((attr) => (
                  <HStack key={attr.id} justifyContent="space-between" p={3} borderWidth="1px" borderRadius="md"
                          borderColor={headerFooterBorderColor}
                          bg={attributeHStackBg}
                  >
                    <Box>
                      <Text fontWeight="bold">{attr.name}:</Text>
                      <Text>{truncateText(attr.value, 50)}</Text>
                    </Box>
                    <Checkbox
                      data-testid={`share-checkbox-${attr.id}`}
                      isChecked={selectedAttributeIds.includes(attr.id)}
                      onChange={() => handleShareCheckboxChange(attr.id)}
                      colorScheme="brand"
                    >
                      Share
                    </Checkbox>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text>No visible attributes found for this context.</Text>
            )}
          </VStack>
        )}
      </VStack>

      <HStack
        width="100%"
        p={4}
        bg={headerFooterBg}
        borderTop="1px solid"
        borderColor={headerFooterBorderColor}
        justifyContent="space-between"
        spacing={4}
      >
        <Button
          data-testid="cancel-button"
          onClick={handleCancel}
          variant="solid"
          colorScheme="gray"
          size="lg"
          flexGrow={1}
        >
          Cancel
        </Button>
        <Button
          data-testid="confirm-selection-button"
          onClick={handleConfirmSelection}
          disabled={!selectedContextId || dataLoading || isSavingConsent}
          colorScheme="brand"
          size="lg"
          flexGrow={1}
        >
          {isSavingConsent ? <Spinner size="sm" /> : 'Confirm Selection'}
        </Button>
      </HStack>
    </Container>
  );
};

export default ContextSelectionPage;
