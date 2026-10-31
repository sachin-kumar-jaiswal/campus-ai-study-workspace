import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/types';
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
  updateProfileApi,
} from '@/services/authService';
import { getErrorMessage } from '@/services/api';

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
}

type AuthAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_DONE'; payload: { user: User; token: string } | null }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'USER_UPDATED'; payload: User }
  | { type: 'AUTH_LOADING' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, isInitializing: true };
    case 'INIT_DONE':
      return action.payload
        ? {
            user: action.payload.user,
            token: action.payload.token,
            isAuthenticated: true,
            isLoading: false,
            isInitializing: false,
          }
        : { ...initialState, isInitializing: false };
    case 'AUTH_LOADING':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
      };
    case 'USER_UPDATED':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...initialState, isInitializing: false };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Storage keys
const TOKEN_KEY = 'campus_ai_token';
const USER_KEY = 'campus_ai_user';

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * On mount: attempt to restore session from localStorage.
   * Validates the stored token by calling /auth/me.
   */
  useEffect(() => {
    const restoreSession = async () => {
      dispatch({ type: 'INIT_START' });

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        dispatch({ type: 'INIT_DONE', payload: null });
        return;
      }

      try {
        const user = await getMeApi();
        dispatch({ type: 'INIT_DONE', payload: { user, token } });
      } catch {
        // Token invalid or expired — clear storage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        dispatch({ type: 'INIT_DONE', payload: null });
      }
    };

    restoreSession();
  }, []);

  const persistAuth = (user: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { user, token } = await loginApi(credentials);
      persistAuth(user, token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'INIT_DONE', payload: null });
      throw new Error(getErrorMessage(error));
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { user, token } = await registerApi(credentials);
      persistAuth(user, token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'INIT_DONE', payload: null });
      throw new Error(getErrorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Continue logout even if API call fails
    } finally {
      clearAuth();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const updateName = useCallback(async (name: string) => {
    try {
      const user = await updateProfileApi(name);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      dispatch({ type: 'USER_UPDATED', payload: user });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
