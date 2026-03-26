import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
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
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'STOP_LOADING':
      return { ...state, loading: false };
    case 'LOGOUT':
      return { user: null, token: null, loading: false };
    default:
      return state;
  }
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
        localStorage.removeItem('peezuhub_token');
        localStorage.removeItem('peezuhub_user');
        dispatch({ type: 'LOGOUT' });
      }
    }

    loadUser();
  }, [state.token]);

  const persistAuth = (data) => {
    localStorage.setItem('peezuhub_token', data.token);
    localStorage.setItem('peezuhub_user', JSON.stringify(data.user));
    dispatch({ type: 'SET_AUTH', payload: data });
  };

  const value = useMemo(() => ({
    ...state,
    async login(payload) {
      const { data } = await client.post('/auth/login', payload);
      persistAuth(data);
    },
    async register(payload) {
      const { data } = await client.post('/auth/register', payload);
      persistAuth(data);
    },
    async googleAuth(payload) {
      const requestBody = typeof payload === 'string'
        ? { credential: payload, mode: 'register' }
        : { ...payload, mode: payload?.mode || 'register' };
      const { data } = await client.post('/auth/google', requestBody);
      persistAuth(data);
    },
    async googleLogin(payload) {
      const requestBody = typeof payload === 'string'
        ? { credential: payload, mode: 'login' }
        : { ...payload, mode: payload?.mode || 'login' };
      const { data } = await client.post('/auth/google', requestBody);
      persistAuth(data);
    },
    logout() {
      localStorage.removeItem('peezuhub_token');
      localStorage.removeItem('peezuhub_user');
      dispatch({ type: 'LOGOUT' });
    },
  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
