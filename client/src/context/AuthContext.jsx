import { createContext, useContext, useEffect, useReducer } from 'react';
import api, { setAuthToken } from '../api/axios.js';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('weather_token'),
  isLoading: true
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return { user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'AUTH_FAILURE':
    case 'LOGOUT':
      return { user: null, token: null, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const storedToken = state.token;

    if (!storedToken) {
      dispatch({ type: 'AUTH_FAILURE' });
      return;
    }

    setAuthToken(storedToken);
    api.get('/auth/me')
      .then(({ data }) => dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user ?? data, token: storedToken } }))
      .catch(() => {
        localStorage.removeItem('weather_token');
        setAuthToken(null);
        dispatch({ type: 'AUTH_FAILURE' });
      });
  }, []);

  async function authenticate(endpoint, credentials) {
    dispatch({ type: 'AUTH_START' });
    const { data } = await api.post(endpoint, credentials);
    const token = data.token;
    const user = data.user;

    localStorage.setItem('weather_token', token);
    setAuthToken(token);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
  }

  async function login(credentials) {
    await authenticate('/auth/login', credentials);
  }

  async function register(credentials) {
    await authenticate('/auth/register', credentials);
  }

  function logout() {
    localStorage.removeItem('weather_token');
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  }

  return <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}