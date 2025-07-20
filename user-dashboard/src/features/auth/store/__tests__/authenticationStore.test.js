import { useAuthenticationStore } from '../authenticationStore';
import * as authService from 'shared/api/authService';
import { useIdentityStore } from 'features/dashboard/store/identityStore';

jest.mock('shared/api/authService', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

jest.mock('features/dashboard/store/identityStore', () => ({
  useIdentityStore: {
    getState: jest.fn(() => ({
      reset: jest.fn(),
    })),
  },
}));

const getInitialState = () => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  selectedContextId: null,
  selectedAttributeIds: [],
});

describe('authenticationStore', () => {
  beforeEach(() => {
    useAuthenticationStore.setState(() => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      selectedContextId: null,
      selectedAttributeIds: [],
      userInfo: null,
      initializeAuth: useAuthenticationStore.getState().initializeAuth,
      login: useAuthenticationStore.getState().login,
      register: useAuthenticationStore.getState().register,
      logout: useAuthenticationStore.getState().logout,
      setSelectedContextId: useAuthenticationStore.getState().setSelectedContextId,
      toggleSelectedAttributeId: useAuthenticationStore.getState().toggleSelectedAttributeId,
      setSelectedAttributeIds: useAuthenticationStore.getState().setSelectedAttributeIds,
      resetSelection: useAuthenticationStore.getState().resetSelection,
    }), true);

    sessionStorage.clear();
    jest.clearAllMocks();
  });


  it('should initialize with correct default state', () => {
    const state = useAuthenticationStore.getState();
    expect(state).toMatchObject(getInitialState());
  });

  describe('login', () => {
    const mockUserData = {
      username: 'testuser',
      password: 'testpass',
    };

    const mockResponse = {
      userId: '123',
      username: 'testuser',
      token: 'abc123token',
    };

    it('should login successfully and update state + sessionStorage', async () => {
      authService.loginUser.mockResolvedValueOnce(mockResponse);

      const { login } = useAuthenticationStore.getState();
      await login(mockUserData.username, mockUserData.password);

      const state = useAuthenticationStore.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe(mockResponse.token);
      expect(state.userInfo).toEqual({ userId: '123', username: 'testuser' });
      expect(sessionStorage.getItem('dashboardJwtToken')).toBe('abc123token');
    });

    it('should fail login and clear authentication state', async () => {
      authService.loginUser.mockRejectedValueOnce(new Error('Invalid login'));

      const { login } = useAuthenticationStore.getState();

      await expect(login(mockUserData.username, mockUserData.password)).rejects.toThrow('Invalid login');

      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userInfo).toBeNull();
    });
  });

  describe('register', () => {
    const mockUserData = {
      username: 'newuser',
      password: 'pass123',
    };

    const mockResponse = {
      userId: '999',
      username: 'newuser',
      token: 'newusertoken',
    };

    it('should register successfully and update state', async () => {
      authService.registerUser.mockResolvedValueOnce(mockResponse);

      const { register } = useAuthenticationStore.getState();
      await register(mockUserData);

      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('newusertoken');
      expect(state.userInfo).toEqual({ userId: '999', username: 'newuser' });
    });

    it('should handle registration error and reset auth state', async () => {
      authService.registerUser.mockRejectedValueOnce(new Error('Registration failed'));

      const { register } = useAuthenticationStore.getState();

      await expect(register(mockUserData)).rejects.toThrow('Registration failed');

      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userInfo).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear auth state, sessionStorage, and reset identity store', () => {
      const identityReset = jest.fn();
      useIdentityStore.getState.mockReturnValueOnce({ reset: identityReset });

      useAuthenticationStore.setState({
        isAuthenticated: true,
        accessToken: 'token',
        userInfo: { userId: '1', username: 'test' },
        selectedContextId: 'ctx1',
        selectedAttributeIds: ['a1'],
      });

      sessionStorage.setItem('dashboardJwtToken', 'token');

      const { logout } = useAuthenticationStore.getState();
      logout();

      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userInfo).toBeNull();
      expect(state.selectedContextId).toBeNull();
      expect(state.selectedAttributeIds).toEqual([]);
      expect(sessionStorage.getItem('dashboardJwtToken')).toBeNull();
      expect(identityReset).toHaveBeenCalled();
    });
  });

  describe('selection actions', () => {
    it('should set selectedContextId', () => {
      const { setSelectedContextId } = useAuthenticationStore.getState();
      setSelectedContextId('context123');

      expect(useAuthenticationStore.getState().selectedContextId).toBe('context123');
    });

    it('should toggle selectedAttributeId on and off', () => {
      const { toggleSelectedAttributeId } = useAuthenticationStore.getState();

      toggleSelectedAttributeId('attr1');
      expect(useAuthenticationStore.getState().selectedAttributeIds).toContain('attr1');

      toggleSelectedAttributeId('attr1');
      expect(useAuthenticationStore.getState().selectedAttributeIds).not.toContain('attr1');
    });

    it('should set selectedAttributeIds', () => {
      const { setSelectedAttributeIds } = useAuthenticationStore.getState();
      setSelectedAttributeIds(['attrA', 'attrB']);

      expect(useAuthenticationStore.getState().selectedAttributeIds).toEqual(['attrA', 'attrB']);
    });

    it('should reset selection', () => {
      useAuthenticationStore.setState({
        selectedContextId: 'ctx',
        selectedAttributeIds: ['a1', 'a2'],
      });

      const { resetSelection } = useAuthenticationStore.getState();
      resetSelection();

      const state = useAuthenticationStore.getState();
      expect(state.selectedContextId).toBeNull();
      expect(state.selectedAttributeIds).toEqual([]);
    });
  });
});
