import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  useColorMode,
  useColorModeValue,
  Spacer,
  Image,
  Heading,
  Spinner,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';

import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { GiAwareness } from "react-icons/gi";
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb';
import { FaTags, FaSignOutAlt, FaRedoAlt, FaHandshake, FaLink } from 'react-icons/fa';

import logo from 'assets/images/logo.webp';

import { useIdentityStore } from 'features/dashboard/store/identityStore';
import { useAuthenticationStore } from "features/auth/store/authenticationStore";

import ContextsContent from 'features/dashboard/components/ContextsContent';
import AttributesContent from 'features/dashboard/components/AttributesContent';
import ConsentsContent from 'features/dashboard/components/ConsentsContent';
import ConnectionsContent from 'features/dashboard/components/ConnectionsContent';

const DashboardPage = () => {

  // Hooks for navigation and authentication
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();

  // Authentication state and actions from the AuthContext
  const { userInfo, isAuthenticated, isLoading: authLoading, logout, accessToken } = useAuthenticationStore();
  const { contexts, attributes, fetchIdentityData, isLoading: dataLoading, error: storeError } = useIdentityStore();

  // Local state for sidebar and current page
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  // Initialize currentPage based on the URL path.
  const [currentPage, setCurrentPage] = useState('contexts');

  // Color mode values for styling
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.600');
  const sidebarBg = useColorModeValue('gray.50', 'gray.800');
  const sidebarHoverBg = useColorModeValue('gray.100', 'gray.700');
  const sidebarActiveBg = useColorModeValue('brand.50', 'brand.800');
  const sidebarTextColor = useColorModeValue('gray.700', 'white');
  const sidebarIconColor = useColorModeValue('gray.600', 'gray.300');
  const appNameColor = useColorModeValue('brand.500', 'brand.300');
  const contentBg = useColorModeValue('white', 'gray.700');
  const contentBorderColor = useColorModeValue('gray.200', 'gray.600');
  const pageLoadingBg = useColorModeValue('gray.50', 'gray.800');
  const pageLoadingTextColor = useColorModeValue('gray.800', 'white');

  // Constants for layout dimensions
  const headerHeight = '70px';
  const sidebarCollapsedWidth = '70px';
  const sidebarExpandedWidth = '220px';

  // Use useMemo to ensure navItems is only created once,
  // preventing unnecessary re-renders of the useEffect hook.
  const navItems = useMemo(() => [
    { id: 'contexts', label: 'Contexts', icon: GiAwareness },
    { id: 'attributes', label: 'Attributes', icon: FaTags },
    { id: 'consents', label: 'Consents', icon: FaHandshake },
    { id: 'connections', label: 'Connections', icon: FaLink },
  ], []);

  /**
   * Effect hook to fetch identity data.
   * This now explicitly waits for authentication to be confirmed and token to be present.
   * It will also re-fetch if there was a previous storeError, giving it a chance to clear.
   */
  useEffect(() => {
    // Only attempt to fetch if authentication is not loading, user is authenticated, and a token exists.
    if (!authLoading && isAuthenticated && accessToken) {
      if (contexts.length === 0 || attributes.length === 0 || storeError) {
        fetchIdentityData(accessToken);
      }
    }
  }, [accessToken, isAuthenticated, authLoading, fetchIdentityData, contexts.length, attributes.length, storeError]);

  /**
   * Effect hook to update the current page based on the URL.
   */
  useEffect(() => {
    // Get the last part of the pathname and use it to set the current page.
    const pathSegments = location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Ensure the segment is one of our valid page IDs before setting the state.
    const validPages = navItems.map(item => item.id);
    if (validPages.includes(lastSegment)) {
      setCurrentPage(lastSegment);
    } else {
      // Default to 'contexts' if the URL doesn't match a known page.
      setCurrentPage('contexts');
    }
  }, [navItems, location.pathname]);

  /**
   * Effect hook to handle redirection for unauthenticated users.
   */
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !accessToken)) {
      console.log("DashboardPage: Not authenticated, redirecting to sign in.");
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, accessToken, navigate]);

  // Function to retry fetching data (for the "Try Again" button on error screen)
  const handleRetryFetch = () => {
    if (accessToken) {
      console.log("DashboardPage: Retrying identity data fetch.");
      fetchIdentityData(accessToken);
    } else {
      console.log("DashboardPage: Cannot retry fetch, authentication token not available.");
    }
  };

  const handleSidebarClick = (item) => {
    navigate('/dashboard/' + item.id);
  }

  // Displays a full-page spinner during authentication or initial data loading
  if (authLoading || dataLoading) {
    return (
      <Flex direction="column" align="center" justify="center" h="100vh" bg={pageLoadingBg}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color={pageLoadingTextColor}>Loading dashboard data...</Text>
      </Flex>
    );
  }

  // Displays a full-page error message if there's a store-related error
  if (storeError) {
    return (
      <Flex direction="column" align="center" justify="center" h="100vh" bg={pageLoadingBg}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          boxShadow="xl"
          mx="auto"
          maxW="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="xl">
            Error Loading Data
          </AlertTitle>
          <AlertDescription maxWidth="sm" mb={4}>
            {storeError}
          </AlertDescription>
          <Button
            leftIcon={<FaRedoAlt />}
            colorScheme="red"
            onClick={handleRetryFetch}
            variant="solid"
          >
            Try Again
          </Button>
        </Alert>
      </Flex>
    );
  }

  // Displays a full-page warning if the user is unauthenticated (as a fallback)
  if (!isAuthenticated || !accessToken) {
    return (
      <Flex direction="column" align="center" justify="center" h="100vh" bg={pageLoadingBg}>
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          boxShadow="xl"
          mx="auto"
          maxW="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="xl">Authentication Required</AlertTitle>
          <AlertDescription maxWidth="sm">
            Please sign in to access the dashboard.
          </AlertDescription>
          <Button mt={4} colorScheme="orange" onClick={() => navigate('/auth')}>Go to Sign In</Button>
        </Alert>
      </Flex>
    );
  }

  // --- Main Dashboard Layout ---
  return (
    <Flex direction="column" h="100vh" w="100vw">
      {/* Header Section: Fixed at the top */}
      <HStack
        as="header"
        w="100%"
        h={headerHeight}
        px={4}
        py={2}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={headerBorderColor}
        justifyContent="space-between"
        alignItems="center"
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex="sticky"
      >
        <HStack spacing={3}>
          <Image src={logo} alt="App Logo" boxSize="40px" borderRadius="15%" />
          <Heading as="h1" size="md" color={appNameColor} ml={2}>
            Contextual Identity API
          </Heading>
        </HStack>
        <Spacer />
        <HStack spacing={4}>
          {userInfo && userInfo.username && (
            <Text fontSize="lg" fontWeight="semibold" color={sidebarTextColor}>
              Hello, {userInfo.username}!
            </Text>
          )}
          <Tooltip label="Toggle Color Mode">
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              size="md"
            />
          </Tooltip>
          <Tooltip label="Sign Out">
            <IconButton
              aria-label="Sign Out"
              icon={<FaSignOutAlt />}
              data-testid="sign-out-button"
              onClick={logout}
              size="md"
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* Main Content Area: Flex container for Sidebar and Body */}
      <Flex
        flex="1"
        mt={headerHeight}
      >
        {/* Sidebar Navigation */}
        <VStack
          as="nav"
          w={isSidebarExpanded ? sidebarExpandedWidth : sidebarCollapsedWidth}
          h={`calc(100vh - ${headerHeight})`}
          bg={sidebarBg}
          borderRight="1px solid"
          borderColor={headerBorderColor}
          position="fixed"
          top={headerHeight}
          left="0"
          zIndex="base"
          alignItems={isSidebarExpanded ? 'flex-start' : 'center'}
          py={4}
          transition="width 0.2s ease-in-out"
          overflowY="auto"
        >
          {/* Sidebar Toggle Button */}
          <Tooltip label={isSidebarExpanded ? "Collapse" : "Expand"}>
            <IconButton
              aria-label={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              icon={isSidebarExpanded ? <TbLayoutSidebarLeftCollapse /> : <TbLayoutSidebarLeftExpand />}
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              size="md"
              isRound={true}
              mb={4}
              alignSelf={isSidebarExpanded ? 'flex-end' : 'center'}
              mr={isSidebarExpanded ? 4 : 0}
            />
          </Tooltip>
          {/* Navigation Items */}
          {navItems.map((item) => (
            <Tooltip label={isSidebarExpanded ? "" : item.label}>
              <Button
                key={item.id}
                data-testid={`nav-${item.id}`}
                aria-label={item.label}
                variant="ghost"
                onClick={() => handleSidebarClick(item)}
                w="full"
                justifyContent={isSidebarExpanded ? 'flex-start' : 'center'}
                px={isSidebarExpanded ? 4 : 0}
                py={isSidebarExpanded ? 3 : 2}
                mb={2}
                color={sidebarTextColor}
                _hover={{ bg: sidebarHoverBg }}
                _active={{ bg: sidebarActiveBg }}
                isActive={currentPage === item.id}
                leftIcon={
                  <Box as={item.icon} boxSize={isSidebarExpanded ? '20px' : '24px'} color={sidebarIconColor} />
                }
              >
                {isSidebarExpanded && <Text ml={2}>{item.label}</Text>}
              </Button>
            </Tooltip>
          ))}
        </VStack>

        {/* Dynamic Content Area */}
        <Box
          flex="1"
          ml={`calc(${isSidebarExpanded ? sidebarExpandedWidth : sidebarCollapsedWidth} + 2rem)`}
          p={6}
          transition="margin-left 0.2s ease-in-out"
          overflowY="auto"
          bg={contentBg}
          borderLeft="1px solid"
          borderColor={contentBorderColor}
          borderRadius="lg"
          boxShadow="lg"
          mr={8}
          my={8}
          minH={`calc(100vh - ${headerHeight} - 4rem)`}
        >
          {(() => {
            // Destructure actions from the store state to ensure they have access to accessToken
            const {
              addContext, updateContext, deleteContext,
              addAttribute, updateAttribute, deleteAttribute
            } = (() => {
              const store = useIdentityStore.getState();
              return {
                addContext: (payload) => store.addContext(payload, accessToken),
                updateContext: (id, payload) => store.updateContext(id, payload, accessToken),
                deleteContext: (id) => store.deleteContext(id, accessToken),
                addAttribute: (payload) => store.addAttribute(payload, accessToken),
                updateAttribute: (id, payload) => store.updateAttribute(id, payload, accessToken),
                deleteAttribute: (id) => store.deleteAttribute(id, accessToken),
              };
            })();

            switch (currentPage) {
              case 'contexts':
                return (
                  <ContextsContent
                    contexts={contexts}
                    attributes={attributes}
                    addContext={addContext}
                    updateContext={updateContext}
                    deleteContext={deleteContext}
                    fetchIdentityData={fetchIdentityData}
                  />
                );
              case 'attributes':
                return (
                  <AttributesContent
                    attributes={attributes}
                    addAttribute={addAttribute}
                    updateAttribute={updateAttribute}
                    deleteAttribute={deleteAttribute}
                    fetchIdentityData={fetchIdentityData}
                  />
                );
              case 'consents':
                return (
                  <ConsentsContent
                    fetchIdentityData={fetchIdentityData}
                    attributes={attributes}
                    contexts={contexts}
                  />
                );
              case 'connections':
                return (
                  <ConnectionsContent />
                );
              default:
                return (
                  <ContextsContent
                    contexts={contexts}
                    attributes={attributes}
                    addContext={addContext}
                    updateContext={updateContext}
                    deleteContext={deleteContext}
                    fetchIdentityData={fetchIdentityData}
                  />
                );
            }
          })()}
        </Box>
      </Flex>
    </Flex>
  );
};

export default DashboardPage;
