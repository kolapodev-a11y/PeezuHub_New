import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('peezuhub_token') || null,
  loading: true,
};

function reducer(state, action) {
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

function persistAuth(data) {
  localStorage.setItem('peezuhub_token', data.token);
  localStorage.setItem('peezuhub_user', JSON.stringify(data.user));
}

function clearAuth() {
  localStorage.removeItem('peezuhub_token');
  localStorage.removeItem('peezuhub_user');
}

function normalizeGooglePayload(payload = {}) {
  const nested = payload && typeof payload === 'object' ? payload : {};

  return {
    accessToken:
      nested.accessToken ||
      nested.access_token ||
      nested.token ||
      (typeof nested.credential === 'object' ? nested.credential?.accessToken : undefined) ||
      '',
    credential:
      typeof nested.credential === 'string'
        ? nested.credential
        : typeof nested.idToken === 'string'
        ? nested.idToken
        : '',
    mode: nested.mode === 'register' ? 'register' : 'login',
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function loadUser() {
      if (!state.token) {
        dispatch({ type: 'STOP_LOADING' });
        return;
      }

      try {
        const { data } = await client.get('/auth/me');
        dispatch({ type: 'SET_AUTH', payload: { user: data.user, token: state.token } });
      } catch {
        clearAuth();
        dispatch({ type: 'LOGOUT' });
      }
    }

    loadUser();
  }, [state.token]);

  const login = useCallback(async (payload) => {
    const { data } = await client.post('/auth/login', payload);
    persistAuth(data);
    dispatch({ type: 'SET_AUTH', payload: data });
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await client.post('/auth/register', payload);
    persistAuth(data);
    dispatch({ type: 'SET_AUTH', payload: data });
    return data;
  }, []);

  const googleAuth = useCallback(async (payload = {}) => {
    const normalized = normalizeGooglePayload(payload);
    const { data } = await client.post('/auth/google', normalized);
    persistAuth(data);
    dispatch({ type: 'SET_AUTH', payload: data });
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('peezuhub_token');
    if (!token) return null;

    try {
      const { data } = await client.get('/auth/me');
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
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) return false;
    }

    logout();
    return true;
  }, [logout]);

  const value = useMemo(
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
  return useContext(AuthContext);
}
