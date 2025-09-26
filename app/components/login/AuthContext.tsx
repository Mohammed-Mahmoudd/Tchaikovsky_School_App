import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, AuthUser, UserType } from "../../services/authService";
import { testSupabaseConnection } from "../../services/testConnection";

interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  checkEmailExists: (
    email: string
  ) => Promise<{ exists: boolean; userType?: UserType }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // eslint-disable-next-line no-console
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const USER_STORAGE_KEY = "@tchaikovsky_user";
const USER_TYPE_STORAGE_KEY = "@tchaikovsky_user_type";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
    // Test Supabase connection on app start
    testSupabaseConnection();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const [storedUser, storedUserType] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(USER_TYPE_STORAGE_KEY),
      ]);

      if (storedUser && storedUserType) {
        const userData = JSON.parse(storedUser);
        const userType = storedUserType as UserType;

        // Verify user still exists in database
        const currentUser = await authService.getUserProfile(
          userData.id,
          userType
        );
        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
        } else {
          // User no longer exists, clear storage
          await clearUserStorage();
        }
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
      await clearUserStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserToStorage = async (userData: AuthUser) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(USER_TYPE_STORAGE_KEY, userData.userType),
      ]);
    } catch (error) {
      console.error("Error saving user to storage:", error);
    }
  };

  const clearUserStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_STORAGE_KEY),
        AsyncStorage.removeItem(USER_TYPE_STORAGE_KEY),
      ]);
    } catch (error) {
      console.error("Error clearing user storage:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Starting login for:", email);

      const authUser = await authService.login(email, password);
      console.log(
        "AuthContext: Login result:",
        authUser ? "SUCCESS" : "FAILED"
      );

      if (authUser) {
        console.log("AuthContext: User type:", authUser.userType);
        setUser(authUser);
        setIsLoggedIn(true);
        await saveUserToStorage(authUser);
        return true;
      } else {
        console.log("AuthContext: No user found");
        return false;
      }
    } catch (error) {
      console.error("AuthContext: Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsLoggedIn(false);
      await clearUserStorage();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await authService.updatePassword(
        user.id,
        user.userType,
        newPassword
      );
      return success;
    } catch (error) {
      console.error("Update password error:", error);
      return false;
    }
  };

  const checkEmailExists = async (
    email: string
  ): Promise<{ exists: boolean; userType?: UserType }> => {
    try {
      return await authService.checkEmailExists(email);
    } catch (error) {
      console.error("Check email exists error:", error);
      return { exists: false };
    }
  };

  const value = {
    isLoggedIn,
    user,
    isLoading,
    login,
    logout,
    updatePassword,
    checkEmailExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
