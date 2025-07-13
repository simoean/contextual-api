import React, {useEffect, useMemo} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';

import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  IconButton,
  useColorMode,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Checkbox,
  useToast,
  Flex,
} from '@chakra-ui/react';

import {MoonIcon, SunIcon} from '@chakra-ui/icons';
import logo from 'assets/images/logo.png';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {useIdentityStore} from 'features/dashboard/store/identityStore';

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

  // Corrected color definitions for header/footer and main card background
  const headerFooterBg = useColorModeValue('gray.100', 'gray.700');
  const headerFooterBorderColor = useColorModeValue('gray.200', 'gray.600');
  const appNameColor = useColorModeValue('brand.500', 'brand.300');
  const mainCardBg = useColorModeValue('white', 'gray.800');
  const mainCardBorderColor = useColorModeValue('gray.200', 'gray.600');

  // Define attribute HStack background at the top level
  const attributeHStackBg = useColorModeValue('gray.100', 'gray.700');

  const popupWidth = "600px";

  // Extract the redirect_uri from the URL query parameters
  const redirectUri = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('redirect_uri');
  }, [location.search]);

  /**
   * Fetch Identity Data
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated && accessToken && contexts.length === 0 && attributes.length === 0) {
      console.log("ContextSelectionPage: Fetching identity data.");
      fetchIdentityData(userInfo);
    }
  }, [userInfo, isAuthenticated, authLoading, fetchIdentityData, contexts.length, attributes.length]);

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
      const initialSelected = filteredAttributes.map(attr => attr.id);
      const currentSelectedAttributeIds = useAuthenticationStore.getState().selectedAttributeIds;

      if (JSON.stringify(initialSelected.sort()) !== JSON.stringify(currentSelectedAttributeIds.sort())) {
        setSelectedAttributeIds(initialSelected);
      }
    } else {
      const currentSelectedAttributeIds = useAuthenticationStore.getState().selectedAttributeIds;
      if (currentSelectedAttributeIds.length > 0) {
        setSelectedAttributeIds([]);
      }
    }
  }, [selectedContextId, filteredAttributes, setSelectedAttributeIds]);

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
   */
  const handleConfirmSelection = () => {
    const finalSelectedContext = contexts.find(ctx => ctx.id === selectedContextId);
    const finalSelectedAttributes = filteredAttributes.filter(attr =>
      selectedAttributeIds.includes(attr.id)
    );

    const authData = {
      token: accessToken,
      userId: userInfo?.userId,
      username: userInfo?.username,
      selectedContext: finalSelectedContext,
      selectedAttributes: finalSelectedAttributes,
    };

    if (window.opener && redirectUri) {
      window.opener.postMessage({type: 'CONTEXT_AUTH_SUCCESS', payload: authData}, redirectUri);
      window.close();
    } else {
      console.warn("No opener window found. Cannot send authentication data.");
      console.log("AuthData payload:", authData);
      toast({
        title: "Authentication data prepared.",
        description: "However, the popup window could not communicate back to the opener.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
    resetSelection();
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
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'light' ? <MoonIcon/> : <SunIcon/>}
          onClick={toggleColorMode}
          size="md"
        />
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
            <Heading as="h3" size="md">Attributes for "{selectedContext.name}" Context:</Heading>
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
                      <Text>{attr.value}</Text>
                    </Box>
                    <Checkbox
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
          onClick={handleCancel}
          variant="solid"
          colorScheme="gray"
          size="lg"
          flexGrow={1}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmSelection}
          disabled={!selectedContextId || dataLoading}
          colorScheme="brand"
          size="lg"
          flexGrow={1}
        >
          Confirm Selection
        </Button>
      </HStack>
    </Container>
  );
};

export default ContextSelectionPage;