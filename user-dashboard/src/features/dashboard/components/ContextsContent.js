import React, {useState, useRef} from 'react';

import {
  VStack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  useColorModeValue,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spacer,
  Flex,
  Badge,
} from '@chakra-ui/react';

import {FaPlus, FaEdit, FaTrashAlt} from 'react-icons/fa';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';

/**
 * ContextsContent Component
 * Displays a list of user contexts and provides CRUD actions.
 *
 * @param {Array<Object>} contexts - Array of all context objects.
 * @param {Array<Object>} attributes - Array of all attribute objects.
 * @param {Function} addContext - Function from the store to add a new context.
 * @param {Function} updateContext - Function from the store to update an existing context.
 * @param {Function} deleteContext - Function from the store to delete a context.
 * @param {Function} fetchIdentityData - Function to re-fetch data after actions.
 * @param {Object} userInfo - User information object (including selectedContext).
 * @param {Function} setUserInfo - Function to update user information.
 */
const ContextsContent = ({
                           contexts,
                           attributes,
                           addContext,
                           updateContext,
                           deleteContext,
                           fetchIdentityData,
                           userInfo,
                           setUserInfo
                         }) => {

  // Color mode values for consistent styling
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('brand.600', 'brand.300');
  const buttonColorScheme = "brand";

  // Styles for the selected context card
  const selectedCardBorderColor = useColorModeValue('brand.500', 'brand.300');
  const selectedCardBg = useColorModeValue('brand.50', 'brand.900');
  const selectedCardShadow = useColorModeValue('lg', 'dark-lg');

  // State and disclosure hook for Add/Edit Context Modal
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // State and disclosure hook for Delete Confirmation AlertDialog
  const {isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose} = useDisclosure();
  const cancelRef = useRef();
  const [contextToDelete, setContextToDelete] = useState(null);

  // Toast hook for displaying user notifications
  const toast = useToast();

  // Get the selectedContextId function from the Auth context
  const {selectedContextId, setSelectedContextId} = useAuthenticationStore();

  /**
   * Resets form and opens modal for adding new context.
   */
  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentContext(null);
    setFormName('');
    setFormDescription('');
    onOpen();
  };

  /**
   * Sets form with context data and opens modal for editing.
   *
   * @param {Object} context - The context object to be edited.
   */
  const handleEditClick = (context) => {
    setIsEditing(true);
    setCurrentContext(context);
    setFormName(context.name);
    setFormDescription(context.description);
    onOpen();
  };

  /**
   * Handles submission of Add/Edit form.
   */
  const handleSubmit = async () => {
    try {
      const contextPayload = {
        name: formName,
        description: formDescription,
      };

      if (isEditing) {
        await updateContext(currentContext.id, contextPayload);
        toast({
          title: "Context updated.",
          description: `Context "${formName}" has been updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addContext(contextPayload);
        toast({
          title: "Context added.",
          description: `Context "${formName}" has been added successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      fetchIdentityData();
      onClose();
    } catch (error) {
      toast({
        title: "Operation failed.",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Context operation failed:", error);
    }
  };

  /**
   * Opens delete confirmation dialog.
   *
   * @param {Object} context - The context to be deleted.
   */
  const confirmDelete = (context) => {
    setContextToDelete(context);
    onDeleteAlertOpen();
  };

  /**
   * Handles deletion after confirmation.
   */
  const handleDeleteConfirmed = async () => {
    if (!contextToDelete) return;

    try {
      await deleteContext(contextToDelete.id);
      // If the deleted context was the selected one, clear it
      if (userInfo?.selectedContext?.id === contextToDelete.id) {
        setUserInfo(prev => ({...prev, selectedContext: null}));
      }
      setSelectedContextId(null);
      toast({
        title: "Context deleted.",
        description: `Context "${contextToDelete.name}" has been deleted.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      fetchIdentityData();
    } catch (error) {
      toast({
        title: "Deletion failed.",
        description: error.message || "An error occurred during deletion.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Context deletion failed:", error);
    } finally {
      onDeleteAlertClose();
      setContextToDelete(null);
    }
  };

  /**
   * Handles context selection (used for filtering attributes later).
   * Now includes logic to deselect if the already-selected context is clicked.
   *
   * @param {Object} context - The context object that was clicked.
   */
  const handleContextSelect = (context) => {
    // Check if the clicked context is already the currently selected context
    const isAlreadySelected = selectedContextId === context.id;

    if (isAlreadySelected) {
      // If it's already selected, deselect it
      setSelectedContextId(null);
      console.log("Context deselected.");
    } else {
      // If it's not selected, select it
      setSelectedContextId(context.id);
      console.log(`Context "${context.name}" selected.`);
    }
  };

  // Render the component
  return (
    <VStack align="flex-start" spacing={6} w="full">
      <HStack justifyContent="space-between" w="full">
        <Heading data-testid="context-heading" as="h2" size="xl" color={headingColor}>Your Contexts</Heading>
        <Button data-testid="add-context-button" leftIcon={<FaPlus/>} colorScheme={buttonColorScheme}
                onClick={handleAddClick}>
          Add Context
        </Button>
      </HStack>
      <Text fontSize="lg" color={textColor}>
        Manage your contextual identities here. Click on a context to view its associated attributes. Click again to
        deselect.
      </Text>

      {contexts.length > 0 ? (
        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6} w="full">
          {contexts.map((context) => {
            const isSelected = selectedContextId === context.id;

            // Filter attributes associated with the current context
            const associatedAttributes = attributes.filter(
              attr => attr.contextIds && attr.contextIds.includes(context.id)
            );

            return (
              <Box
                key={context.id}
                p={5}
                data-testid={`context-card-${context.id}`}
                borderWidth={isSelected ? "2px" : "1px"}
                borderRadius="lg"
                boxShadow={isSelected ? selectedCardShadow : "sm"}
                bg={isSelected ? selectedCardBg : cardBg}
                borderColor={isSelected ? selectedCardBorderColor : cardBorderColor}
                _hover={{
                  boxShadow: isSelected ? selectedCardShadow : "md",
                  cursor: "pointer",
                  transform: isSelected ? 'scale(1.02)' : 'scale(1.01)',
                  transition: 'transform 0.1s ease-in-out',
                }}
                transition="all 0.2s ease-in-out"
                onClick={() => handleContextSelect(context)}
              >
                <VStack align="flex-start" spacing={3} h="full">
                  <HStack flexWrap="wrap">
                    <Text fontSize="xl" fontWeight="bold" color={textColor} noOfLines={1}>
                      Context:
                    </Text>
                    <Text fontSize="xl" color={textColor} noOfLines={1}>
                      {context.name}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" flexGrow={1}>
                    {context.description || 'No description provided.'}
                  </Text>

                  {/* Display Associated Attributes */}
                  <VStack align="flex-start" spacing={1} w="full" mt={2}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" mt={2} pt={2} borderTopWidth="1px"
                          borderColor={cardBorderColor}>Associated Attributes:</Text>
                    {associatedAttributes.length > 0 ? (
                      <Flex wrap="wrap" gap={1}>
                        {associatedAttributes.map(attr => (
                          <Badge
                            key={attr.id}
                            colorScheme="purple"
                            variant="subtle"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            fontSize="xs"
                            textTransform="none"
                          >
                            {attr.name}
                          </Badge>
                        ))}
                      </Flex>
                    ) : (
                      <Text fontSize="xs" color="gray.400">No attributes associated.</Text>
                    )}
                  </VStack>

                  <Spacer/>

                  <HStack
                    w="full"
                    justifyContent="flex-end"
                    spacing={2}
                    mt={3}
                    pt={3}
                    borderTopWidth="1px"
                    borderColor={cardBorderColor}
                  >
                    <Button
                      leftIcon={<FaEdit/>}
                      size="sm"
                      data-testid={`edit-context-button-${context.id}`}
                      colorScheme={buttonColorScheme}
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(context);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      leftIcon={<FaTrashAlt/>}
                      size="sm"
                      data-testid={`delete-context-button-${context.id}`}
                      colorScheme="red"
                      variant="solid"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(context);
                      }}
                    >
                      Delete
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>
      ) : (
        <Text color={textColor}>No contexts found. Click "Add Context" to create one.</Text>
      )}

      {/* Add/Edit Context Modal */}
      <Modal data-testid="edit-create-modal" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Context' : 'Add New Context'}</ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <FormControl id="context-name" isRequired mb={4}>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="e.g., 'Work', 'Personal', 'Shopping'"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </FormControl>
            <FormControl id="context-description" mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="A brief description of this context"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button data-testid="cancel-edit-create" variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
            <Button data-testid="edit-create-context" colorScheme={buttonColorScheme} onClick={handleSubmit}>
              {isEditing ? 'Update Context' : 'Create Context'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Context
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete context "<strong>{contextToDelete?.name}</strong>"? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button data-testid="cancel-delete" ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button data-testid="confirm-delete" colorScheme="red" onClick={handleDeleteConfirmed} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default ContextsContent;