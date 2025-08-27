import React, {useState, useRef, useEffect, useCallback} from 'react';

import {
  VStack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  useColorModeValue,
  Button,
  HStack,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Tag,
  TagLabel,
  Spinner,
  IconButton,
  Select,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';

import {FaTrashAlt, FaBan, FaClock, FaCalendarAlt, FaHistory} from 'react-icons/fa';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {fetchConsents, revokeConsent, removeAttributeFromConsent, recordConsent} from 'shared/api/authService';

// Mock TokenValidity enum to use in the frontend, now matching the backend
const TokenValidity = {
  ONE_MINUTE: "1 Minute",
  ONE_HOUR: "1 Hour",
  ONE_DAY: "1 Day",
  ONE_MONTH: "1 Month",
  ONE_YEAR: "1 Year",
};

/**
 * ConsentContent Component
 * Displays a list of user consents and provides revocation actions.
 *
 * @param {Function} fetchIdentityData - Function to re-fetch identity data after actions.
 * @param {Array<Object>} attributes - Array of all available attribute objects.
 * @param {Array<Object>} contexts - Array of all available context objects.
 */
const ConsentContent = ({fetchIdentityData, attributes, contexts}) => {
  // Color mode values for consistent styling
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('brand.600', 'brand.300');
  const buttonColorScheme = "brand";

  // State for the raw consents data and enriched data for display
  const [consents, setConsents] = useState([]);
  const [enrichedConsents, setEnrichedConsents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State and disclosure hook for Revoke All confirmation AlertDialog
  const {isOpen: isRevokeAlertOpen, onOpen: onRevokeAlertOpen, onClose: onRevokeAlertClose} = useDisclosure();
  const cancelRef = useRef();
  const [consentToRevoke, setConsentToRevoke] = useState(null);

  // State and disclosure hook for Remove Attribute confirmation AlertDialog
  const {isOpen: isRemoveAlertOpen, onOpen: onRemoveAlertOpen, onClose: onRemoveAlertClose} = useDisclosure();
  const [attributeToRemove, setAttributeToRemove] = useState(null);

  // New state and disclosure hook for the Edit Validity AlertDialog
  const {isOpen: isEditAlertOpen, onOpen: onValidityAlertOpen, onClose: onEditAlertClose} = useDisclosure();
  const [consentToEdit, setConsentToEdit] = useState(null);
  const [selectedValidity, setSelectedValidity] = useState('ONE_DAY');

  // New state for the attributes that can be added
  const [unsharedAttributes, setUnsharedAttributes] = useState([]);
  const [selectedNewAttributes, setSelectedNewAttributes] = useState([]);

  // Toast hook for displaying user notifications
  const toast = useToast();

  // Get the access token from the authentication store
  const {accessToken} = useAuthenticationStore();

  /**
   * Fetches all consent records for the authenticated user from the API.
   * Wrapped in useCallback to prevent unnecessary re-creations.
   */
  const fetchUserConsents = useCallback(async () => {
    if (!accessToken) {
      console.log('No access token, skipping consent fetch.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const fetchedConsents = await fetchConsents(accessToken);
      setConsents(fetchedConsents);
    } catch (error) {
      toast({
        title: 'Error fetching consents.',
        description: 'Failed to retrieve your consent records.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Failed to fetch consents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  // Fetch consents on component load or when accessToken changes
  useEffect( () => {
    fetchUserConsents();
  }, [fetchUserConsents, accessToken]);

  /**
   * Effect to enrich consents with attribute names whenever consents or attributes change.
   */
  useEffect(() => {
    if (consents.length > 0 && attributes.length > 0) {
      const enriched = consents.map(consent => {
        // Map the sharedAttribute IDs to their full attribute objects
        const sharedAttributes = consent.sharedAttributes
          .map(sharedAttrId => attributes.find(attr => attr.id === sharedAttrId))
          .filter(attr => attr);

        return {...consent, sharedAttributes};
      });
      setEnrichedConsents(enriched);
    } else {
      setEnrichedConsents(consents);
    }
  }, [consents, attributes]);


  /**
   * Opens the confirmation dialog for revoking all attributes of a consent.
   * @param {Object} consent - The consent object to be revoked.
   */
  const confirmRevokeAll = (consent) => {
    setConsentToRevoke(consent);
    onRevokeAlertOpen();
  };

  /**
   * Handles the deletion of an entire consent record after confirmation.
   */
  const handleRevokeConfirmed = async () => {
    if (!consentToRevoke) return;

    try {
      await revokeConsent(accessToken, consentToRevoke.id);
      toast({
        title: "Consent revoked.",
        description: `All attributes for "${consentToRevoke.clientId}" have been removed.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserConsents();
      fetchIdentityData();
    } catch (error) {
      toast({
        title: "Revocation failed.",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Consent revocation failed:", error);
    } finally {
      onRevokeAlertClose();
      setConsentToRevoke(null);
    }
  };

  /**
   * Opens the confirmation dialog for removing a single attribute.
   * @param {string} consentId - The ID of the consent.
   * @param {Object} attribute - The attribute object to be removed.
   */
  const confirmRemoveAttribute = (consentId, attribute) => {
    setAttributeToRemove({
      consentId: consentId,
      attribute: attribute,
    });
    onRemoveAlertOpen();
  };

  /**
   * Handles the removal of a single attribute from a consent after confirmation.
   */
  const handleRemoveAttributeConfirmed = async () => {
    if (!attributeToRemove) return;

    try {
      const {consentId, attribute} = attributeToRemove;
      await removeAttributeFromConsent(accessToken, consentId, attribute.id);
      toast({
        title: "Attribute removed.",
        description: `Attribute "${attribute.name}" has been removed from the consent.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserConsents();
      fetchIdentityData();
    } catch (error) {
      toast({
        title: "Removal failed.",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Attribute removal failed:", error);
    } finally {
      onRemoveAlertClose();
      setAttributeToRemove(null);
    }
  };

  /**
   * Opens the modal for editing the validity of a consent's token.
   * Also populates the list of unshared attributes by the contextId.
   * @param {Object} consent - The consent object to edit.
   */
  const handleEditClick = (consent) => {
    setConsentToEdit(consent);
    setSelectedValidity(consent.tokenValidity || 'ONE_DAY');
    setSelectedNewAttributes([]); // Reset the selection every time the modal opens

    const consentContextId = consent.contextId;
    const sharedAttributeIds = new Set(consent.sharedAttributes.map(attr => attr.id));

    // Filter attributes based on the consent's contextId
    const unshared = attributes.filter(attr =>
      attr.contextIds && attr.contextIds.includes(consentContextId) && !sharedAttributeIds.has(attr.id)
    );

    setUnsharedAttributes(unshared);

    onValidityAlertOpen();
  };

  /**
   * Handles the saving of the new token validity and new attributes.
   */
  const handleSaveConfirmed = async () => {
    if (!consentToEdit) return;

    try {
      const {clientId, contextId} = consentToEdit;
      // Combine existing shared attributes with newly selected ones
      const currentSharedAttributeIds = consentToEdit.sharedAttributes.map(attr => attr.id);
      const allSharedAttributeIds = [...currentSharedAttributeIds, ...selectedNewAttributes];

      // Now pass the contextId to the recordConsent function
      await recordConsent(accessToken, clientId, contextId, allSharedAttributeIds, selectedValidity);

      toast({
        title: "Consent Updated",
        description: `The consent for "${consentToEdit?.clientId}" has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserConsents();
    } catch (error) {
      toast({
        title: "Update failed.",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Consent update failed:", error);
    } finally {
      onEditAlertClose();
      setConsentToEdit(null);
    }
  };


  // Show a loading spinner while fetching data
  if (isLoading) {
    return (
      <VStack align="center" justify="center" h="50vh" w="full">
        <Spinner size="xl" color={headingColor}/>
        <Text mt={4} color={textColor}>Loading your consents...</Text>
      </VStack>
    );
  }

  // Render the component using enrichedConsents
  return (
    <VStack align="flex-start" spacing={6} w="full">
      <HStack justifyContent="space-between" w="full">
        <Heading data-testid="consent-heading" as="h2" size="xl" color={headingColor}>Your Consents</Heading>
      </HStack>
      <Text fontSize="lg" color={textColor}>
        Manage the permissions you have granted to different applications here. You can revoke access entirely or remove
        specific attributes.
      </Text>

      {enrichedConsents.length > 0 ? (
        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6} w="full">
          {enrichedConsents.map((consent) => (
            <Box
              key={consent.id}
              p={5}
              data-testid={`consent-card-${consent.id}`}
              borderWidth="1px"
              borderRadius="lg"
              boxShadow="sm"
              bg={cardBg}
              borderColor={cardBorderColor}
              h="full"
              _hover={{
                boxShadow: "md",
                cursor: "pointer",
                transform: 'scale(1.01)',
                transition: 'transform 0.1s ease-in-out',
              }}
              transition="all 0.2s ease-in-out"
              onClick={() => handleEditClick(consent)}
            >
              <VStack align="flex-start" spacing={3} h="full">
                <HStack w="full" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <HStack>
                      <Text fontSize="xl" fontWeight="bold" color={textColor} noOfLines={1}>
                        Client:
                      </Text>
                      <Text fontSize="xl" color={textColor} noOfLines={1}>
                        {consent.clientId}
                      </Text>
                    </HStack>
                  </Box>

                  {(() => {
                    // Find the context that matches the consent's contextId
                    const context = contexts.find(c => c.id === consent.contextId);
                    return context ? (
                      <Tag size="md" colorScheme="purple" borderRadius="full" variant="solid">
                        <TagLabel>{context.name}</TagLabel>
                      </Tag>
                    ) : null;
                  })()}
                </HStack>

                {/* Display consent info on the card */}
                <Flex alignItems="center" mt={2}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.500" mr={2}>Token Validity:</Text>
                  <Text fontSize="sm" color={textColor}>
                    {consent.tokenValidity ? TokenValidity[consent.tokenValidity] : 'N/A'}
                  </Text>
                </Flex>

                <Flex alignItems="center" mt={1}>
                  <FaCalendarAlt color="gray" style={{ marginRight: '8px' }} />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.500" mr={2}>Granted:</Text>
                  <Text fontSize="sm" color={textColor}>
                    {new Date(consent.createdAt).toLocaleDateString()}
                  </Text>
                </Flex>

                <Flex alignItems="center" mt={1}>
                  <FaHistory color="gray" style={{ marginRight: '8px' }} />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.500" mr={2}>Last Accessed:</Text>
                  <Text fontSize="sm" color={textColor}>
                    {consent.accessedAt && consent.accessedAt.length > 0
                      ? new Date(consent.accessedAt[consent.accessedAt.length - 1]).toLocaleString()
                      : 'Never'}
                  </Text>
                </Flex>

                <Text fontSize="sm" fontWeight="semibold" color="gray.500" mt={2} pt={2} borderTopWidth="1px"
                      borderColor={cardBorderColor}>Shared Attributes:</Text>

                {/* Display Shared Attributes */}
                <VStack align="flex-start" spacing={2} w="full">
                  {consent.sharedAttributes && consent.sharedAttributes.length > 0 ? (
                    consent.sharedAttributes.map(attr => (
                      <Flex key={attr.id} w="full" alignItems="center" justifyContent="space-between">
                        {/* Now `attr.name` is available directly */}
                        <Text fontSize="md" color={textColor}>{attr.name}</Text>
                        <IconButton
                          aria-label={`Remove ${attr.name}`}
                          icon={<FaTrashAlt/>}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          data-testid={`remove-attribute-button-${attr.id}`}
                          onClick={(e) => { e.stopPropagation(); confirmRemoveAttribute(consent.id, attr) }}
                        />
                      </Flex>
                    ))
                  ) : (
                    <Text fontSize="sm" color="gray.400">No attributes shared.</Text>
                  )}
                </VStack>

                <HStack
                  w="full"
                  justifyContent="flex-end"
                  spacing={2}
                  mt="auto" // This is the key change to push the buttons to the bottom
                  pt={3}
                  borderTopWidth="1px"
                  borderColor={cardBorderColor}
                >
                  <Button
                    leftIcon={<FaClock/>}
                    size="sm"
                    data-testid={`edit-validity-button-${consent.id}`}
                    colorScheme={buttonColorScheme}
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handleEditClick(consent) }}
                  >
                    Edit
                  </Button>
                  <Button
                    leftIcon={<FaBan/>}
                    size="sm"
                    data-testid={`revoke-all-button-${consent.id}`}
                    colorScheme="red"
                    variant="solid"
                    onClick={(e) => { e.stopPropagation(); confirmRevokeAll(consent) }}
                  >
                    Revoke
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Text color={textColor}>No consents found. Your data has not been shared with any applications yet.</Text>
      )}

      {/* Revoke All Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isRevokeAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRevokeAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Revoke Consent
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to revoke consent for "<strong>{consentToRevoke?.clientId}</strong>"? This will
              remove all shared attributes. This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button data-testid="cancel-revoke" ref={cancelRef} onClick={onRevokeAlertClose}>
                Cancel
              </Button>
              <Button data-testid="confirm-revoke" colorScheme="red" onClick={handleRevokeConfirmed} ml={3}>
                Revoke All
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Remove Attribute Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isRemoveAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Attribute
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to remove the attribute "<strong>{attributeToRemove?.attribute?.name}</strong>"?
              This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button data-testid="cancel-remove-attribute" ref={cancelRef} onClick={onRemoveAlertClose}>
                Cancel
              </Button>
              <Button data-testid="confirm-remove-attribute" colorScheme="red" onClick={handleRemoveAttributeConfirmed}
                      ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Edit AlertDialog */}
      <AlertDialog
        isOpen={isEditAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onEditAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Edit Consent for "{consentToEdit?.clientId}"
            </AlertDialogHeader>
            <AlertDialogBody>
              {/* Validity Section */}
              <FormControl id="token-validity" mb={6}>
                <FormLabel>Token Validity Period</FormLabel>
                <Select
                  value={selectedValidity}
                  onChange={(e) => setSelectedValidity(e.target.value)}
                  placeholder="Select validity"
                >
                  {Object.keys(TokenValidity).map((key) => (
                    <option key={key} value={key}>
                      {TokenValidity[key]}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Add Attributes Section */}
              {unsharedAttributes.length > 0 && (
                <FormControl id="add-attributes">
                  <FormLabel>Add Attributes</FormLabel>
                  <CheckboxGroup
                    onChange={setSelectedNewAttributes}
                    value={selectedNewAttributes}
                  >
                    <VStack align="flex-start">
                      {unsharedAttributes.map(attr => (
                        <Checkbox key={attr.id} value={attr.id} data-testid={`add-attribute-${attr.id}`}>
                          {attr.name}
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                </FormControl>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button data-testid="cancel-edit-validity" ref={cancelRef} onClick={onEditAlertClose}>
                Cancel
              </Button>
              <Button data-testid="confirm-edit-validity" colorScheme={buttonColorScheme}
                      onClick={handleSaveConfirmed} ml={3}>
                Save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default ConsentContent;
