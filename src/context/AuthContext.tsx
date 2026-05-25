import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import client from '../api/client';
import type {
  AuthPayload,
  AuthUser,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

type NormalizedGooglePayload = {
  accessToken: string;
  credential: string;
  mode: 'login' | 'register';
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<AuthPayload>;
  register: (payload: RegisterPayload) => Promise<AuthPayload>;
  googleAuth: (payload?: GoogleAuthPayload) => Promise<AuthPayload>;
  googleLogin: (payload?: GoogleAuthPayload) => Promise<AuthPayload>;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
  logoutWithConfirmation: () => boolean;
};

type AuthAction =
  | { type: 'SET_AUTH'; payload: AuthPayload }
  | { type: 'STOP_LOADING' }
  | { type: 'LOGOUT' };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? window.localStorage.getItem('peezuhub_token') : null,
  loading: true,
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'STOP_LOADING':
      return { ...state, loading: false };
    case 'LOGOUT':
      return { user: null, token: null, loading: false };
    default:
      return state;
  }
}

function persistAuth(data: AuthPayload) {
  window.localStorage.setItem('peezuhub_token', data.token);
  window.localStorage.setItem('peezuhub_user', JSON.stringify(data.user));
}

function clearAuth() {
  window.localStorage.removeItem('peezuhub_token');
  window.localStorage.removeItem('peezuhub_user');
}

function normalizeGooglePayload(payload: GoogleAuthPayload = {}): NormalizedGooglePayload {
  const nested = payload && typeof payload === 'object' ? payload : {};

  return {
    accessToken:
      nested.accessToken ||
      nested.access_token ||
      nested.token ||
      (typeof nested.credential === 'object' ? nested.credential?.accessToken || '' : ''),
    credential:
      typeof nested.credential === 'string'
        ? nested.credential
        : typeof nested.idToken === 'string'
          ? nested.idToken
          : '',
    mode: nested.mode === 'register' ? 'register' : 'login',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function loadUser() {
      if (!state.token) {
        dispatch({ type: 'STOP_LOADING' });
        return;
      }

      try {
        const { data } = await client.get<{ user: AuthUser }>('/auth/me');
        dispatch({ type: 'SET_AUTH', payload: { user: data.user, token: state.token as string } });
      } catch {
        clearAuth();
        dispatch({ type: 'LOGOUT' });
      }
    }

    void loadUser();
  }, [state.token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await client.post<AuthPayload>('/auth/login', payload);
    persistAuth(data);
    dispatch({ type: 'SET_AUTH', payload: data });
    return data;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await client.post<AuthPayload>('/auth/register', payload);
    persistAuth(data);
    dispatch({ type: 'SET_AUTH', payload: data });
    return data;
  }, []);

  const googleAuth = useCallback(async (payload: GoogleAuthPayload = {}) => {
    const normalized = normalizeGooglePayload(payload);
    const { data } = await client.post<AuthPayload>('/auth/google', normalized);
    persistAuth(data);
    dispatch({ type: 'SET_AUTH', payload: data });
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const token = window.localStorage.getItem('peezuhub_token');
    if (!token) return null;

    try {
      const { data } = await client.get<{ user: AuthUser }>('/auth/me');
      dispatch({ type: 'SET_AUTH', payload: { user: data.user, token } });
      return data.user;
    } catch {
      clearAuth();
      dispatch({ type: 'LOGOUT' });
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const logoutWithConfirmation = useCallback(() => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return false;

    logout();
    return true;
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      googleAuth,
      googleLogin: googleAuth,
      refreshUser,
      logout,
      logoutWithConfirmation,
    }),
    [state, login, register, googleAuth, refreshUser, logout, logoutWithConfirmation]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
