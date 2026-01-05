import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  email: string;
  name: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@tymee_auth';

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isLoading: true,
  user: null,

  login: async (user: User) => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      set({isLoggedIn: true, user});
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      set({isLoggedIn: false, user: null});
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  },

  checkAuth: async () => {
    try {
      set({isLoading: true});
      const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        const user = JSON.parse(authData) as User;
        set({isLoggedIn: true, user, isLoading: false});
      } else {
        set({isLoggedIn: false, user: null, isLoading: false});
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      set({isLoggedIn: false, user: null, isLoading: false});
    }
  },
}));
