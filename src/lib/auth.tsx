import { createContext, useContext, useEffect, useState } from "react";
import { API_ENDPOINTS, apiClient, handleApiError } from "./api";

interface User {
  username: string;
  role: string;
}

interface LoginResponse {
  status: number;
  message: string;
  data: {
    username: string;
    accessToken: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트 마운트 시 저장된 토큰이 있으면 사용자 상태 복원
  useEffect(() => {
    import("./api").then(({ setTokenExpirationCallback }) => {
      setTokenExpirationCallback(handleTokenExpiration);
    });

    const token = localStorage.getItem("auth_token");

    if (token) {
      try {
        // JWT 토큰에서 사용자 정보 추출
        const userInfo = parseJwt(token);

        // JWT 구조에 따라 username 또는 sub 필드 확인
        const username = userInfo.username || userInfo.sub;
        const role = userInfo.role || "USER";

        if (username) {
          setUser({ username, role });
        }
      } catch (error) {
        console.error("토큰 파싱 실패:", error);
        // 토큰이 유효하지 않으면 제거
        localStorage.removeItem("auth_token");
      }
    }
  }, []);

  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { username, password }
      );

      if (response.error) {
        return { error: response.error };
      }

      if (response.data && response.data.status === 200) {
        const { username: userUsername, accessToken } = response.data.data;

        // JWT 토큰에서 role 정보 추출
        const userInfo = parseJwt(accessToken);
        const role = userInfo.role || "USER";

        setUser({ username: userUsername, role });
        localStorage.setItem("auth_token", accessToken);
        return {};
      }

      return { error: response.data?.message || "로그인에 실패했습니다." };
    } catch (error) {
      const errorMessage = handleApiError(error, "로그인");
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem("auth_token");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // JWT 토큰 파싱 함수
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const parsed = JSON.parse(jsonPayload);
      return parsed;
    } catch (error) {
      console.error("JWT parsing failed:", error);
      return { username: "", userId: 0, role: "USER" };
    }
  };

  // 토큰 만료 처리 함수 추가
  const handleTokenExpiration = () => {
    // 사용자 상태 초기화
    setUser(null);

    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem("auth_token");

    // 로그인 페이지로 리다이렉트
    window.location.href = "/login";
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    handleTokenExpiration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
