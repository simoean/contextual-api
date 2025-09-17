import { extendTheme } from '@chakra-ui/react';

// Define custom colors for the theme
const colors = {
  brand: {
    50: '#e0f7f7',
    100: '#b3e0e0',
    200: '#80caca',
    300: '#4db3b3',
    400: '#269999',
    500: '#007070',
    600: '#006666',
    700: '#004d4d',
    800: '#003333',
    900: '#001a1a',
  },
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#667085',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
  red: {
    500: '#D53F8C',
    600: '#C53030',
    700: '#9B2C2C',
    800: '#822727'
  }
};

// App theme configuration
const theme = extendTheme({
  colors,
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: 'semibold',
      },

      // Page and Action Button Variants
      variants: {
        solid: (props) => ({
          color: 'white',
          ...(props.colorScheme === 'brand' && {
            bg: props.colorMode === 'light' ? 'brand.500' : 'brand.600',
            _hover: {
              bg: props.colorMode === 'light' ? 'brand.600' : 'brand.500',
            },
            _active: {
              bg: props.colorMode === 'light' ? 'brand.700' : 'brand.400',
            },
          }),
          ...(props.colorScheme === 'gray' && {
            bg: props.colorMode === 'light' ? 'gray.300' : 'gray.600',
            color: props.colorMode === 'light' ? 'gray.800' : 'white',
            _hover: {
              bg: props.colorMode === 'light' ? 'gray.500' : 'gray.500',
              color: 'white',
            },
            _active: {
              bg: props.colorMode === 'light' ? 'gray.600' : 'gray.700',
            },
          }),
          // Updated red color scheme for better contrast
          ...(props.colorScheme === 'red' && {
            bg: 'red.600',
            _hover: { bg: 'red.700' },
            _active: { bg: 'red.800' },
          }),
        }),
        outline: (props) => ({
          borderColor: props.colorScheme === 'brand' ? 'brand.500' : (props.colorMode === 'light' ? 'gray.200' : 'gray.600'),
          color: props.colorScheme === 'brand' ? 'brand.500' : (props.colorMode === 'light' ? 'gray.700' : 'white'),
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.50' : (props.colorMode === 'light' ? 'gray.50' : 'gray.700'),
            color: props.colorScheme === 'brand' ? 'brand.500' : (props.colorMode === 'light' ? 'gray.700' : 'white'),
          },
        }),
        ghost: (props) => ({
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.50' : (props.colorMode === 'light' ? 'gray.50' : 'gray.700'),
          },
        }),

        // Contextual Button Variants - selected and unselected
        selectedContext: (props) => ({
          bg: props.colorMode === 'light' ? 'brand.500' : 'brand.600',
          color: 'white',
          fontSize: 'lg',
          fontWeight: 'semibold',
          _hover: {
            bg: props.colorMode === 'light' ? 'brand.600' : 'brand.400',
            color: props.colorMode === 'light' ? 'white' : 'white',
          },
          _active: {
            bg: props.colorMode === 'light' ? 'brand.700' : 'brand.400',
            color: props.colorMode === 'light' ? 'white' : 'gray.800',
          },
        }),
        unselectedContext: (props) => ({
          borderWidth: '2px',
          borderColor: props.colorMode === 'light' ? 'gray.200' : 'white',
          bg: props.colorMode === 'light' ? 'white' : 'gray.700',
          color: props.colorMode === 'light' ? 'gray.700' : 'white',
          fontSize: 'lg',
          fontWeight: 'semibold',
          _hover: {
            bg: props.colorMode === 'light' ? 'brand.500' : 'brand.600',
            color: 'white',
          },
        }),
      },
    },

    // Theme selector
    IconButton: {
      baseStyle: (props) => ({
        isRound: true,
        bg: props.colorMode === 'light' ? 'gray.400' : 'gray.600',
        color: props.colorMode === 'light' ? 'gray.800' : 'white',
        _hover: {
          bg: props.colorMode === 'light' ? 'gray.300' : 'gray.500',
          color: 'white',
        },
      }),
    },

    // Form components
    Input: {
      baseStyle: (props) => ({
        field: {
          borderColor: props.colorMode === 'light' ? 'gray.300' : 'gray.600',
          color: props.colorMode === 'light' ? 'gray.800' : 'white',
          _hover: {
            borderColor: props.colorMode === 'light' ? 'gray.400' : 'gray.500',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: `0 0 0 1px ${colors.brand[500]}`,
          },
          _placeholder: {
            color: props.colorMode === 'light' ? 'gray.500' : 'gray.400',
          },
        },
      }),
    },
    Text: {
      baseStyle: (props) => ({
        color: props.colorMode === 'light' ? 'gray.800' : 'white',
      }),
      variants: {
        subtitle: (props) => ({
          color: props.colorMode === 'light' ? 'gray.600' : 'gray.400',
        }),
      },
    },
    Heading: {
      baseStyle: (props) => ({
        color: props.colorMode === 'light' ? 'gray.800' : 'white',
      }),
    },
    Container: {
      variants: {
        fullPageBackground: (props) => ({
          bg: props.colorMode === 'light' ? 'gray.50' : 'gray.800',
          color: props.colorMode === 'light' ? 'gray.800' : 'white',
        }),
      },
    },
    Alert: {
      variants: {
        subtle: (props) => ({
          container: {
            bg: props.colorMode === 'light' ? 'gray.800' : 'gray.100',
            color: props.colorMode === 'light' ? 'white' : 'gray.800',
            borderRadius: 'md',
            boxShadow: 'lg',
            py: 3, px: 4,
          },
          icon: {
            color: props.status === 'error' ? (props.colorMode === 'light' ? 'red.400' : 'red.600') :
              props.status === 'warning' ? (props.colorMode === 'light' ? 'orange.400' : 'orange.600') :
                props.status === 'success' ? (props.colorMode === 'light' ? 'green.400' : 'green.600') :
                  (props.colorMode === 'light' ? 'blue.400' : 'blue.600'),
          },
          title: {
            color: props.colorMode === 'light' ? 'white' : 'gray.800',
          },
          description: {
            color: props.colorMode === 'light' ? 'whiteAlpha.800' : 'gray.700',
          },
          'div[role=alert]': {
            borderLeft: '4px solid',
            borderColor: props.status === 'error' ? (props.colorMode === 'light' ? 'red.400' : 'red.600') :
              props.status === 'warning' ? (props.colorMode === 'light' ? 'orange.400' : 'orange.600') :
                props.status === 'success' ? (props.colorMode === 'light' ? 'green.400' : 'green.600') :
                  (props.colorMode === 'light' ? 'blue.400' : 'blue.600'),
          }
        })
      }
    }
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
