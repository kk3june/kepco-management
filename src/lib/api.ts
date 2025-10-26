import { CompanyNameCheckResponse } from "@/types/database";

const API_BASE_URL = import.meta.env.DEV
  ? "" // 개발 환경에서는 프록시 사용
  : import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

type TokenExpirationCallback = () => void;

// 전역 토큰 만료 콜백 변수
let tokenExpirationCallback: TokenExpirationCallback | null = null;

// 토큰 만료 콜백 설정 함수
export function setTokenExpirationCallback(callback: TokenExpirationCallback) {
  tokenExpirationCallback = callback;
}
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // 인증 토큰 가져오기
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // options.headers가 있으면 추가
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        // 403 에러 처리 추가
        if (response.status === 403) {
          // 토큰 만료 처리
          this.handleTokenExpiration();
          return {
            error: "인증이 만료되었습니다. 다시 로그인해주세요.",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          error:
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private handleTokenExpiration() {
    // localStorage에서 토큰 제거
    localStorage.removeItem("auth_token");

    // 콜백 함수가 설정되어 있으면 호출
    if (tokenExpirationCallback) {
      tokenExpirationCallback();
    } else {
      // 기본 동작: 로그인 페이지로 리다이렉트
      window.location.href = "/login";
    }
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST 요청
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT 요청
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // PATCH 요청
  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // 파일 업로드
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: any
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const url = `${this.baseUrl}${endpoint}`;

      // 인증 토큰 가져오기
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error:
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("File upload failed:", error);
      return {
        error: error instanceof Error ? error.message : "File upload failed",
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API 엔드포인트 상수 (Swagger 문서 기반)
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
  },

  // 영업사원
  SALES_REPS: {
    LIST: "/api/home/admin-salesman",
    CREATE: "/api/salesman/register",
    UPDATE: (id: string) => `/api/salesman/${id}`,
    DELETE: (id: string) => `/api/salesman/${id}`,
    GET: (id: string) => `/api/salesman/${id}`,
  },

  // 엔지니어
  ENGINEERS: {
    LIST: "/api/home/admin-engineer",
    CREATE: "/api/engineer/register",
    UPDATE: (id: string) => `/api/engineer/${id}`,
    DELETE: (id: string) => `/api/engineer/${id}`,
    GET: (id: string) => `/api/engineer/${id}`,
  },

  // 고객
  CUSTOMERS: {
    LIST: "/api/home/admin-customer" as string,
    USER_CUSTOMERS: "/api/home/user-customer" as string, // 사용자별 수용가 조회
    CREATE: "/api/customer",
    UPDATE: (id: string) => `/api/customer/${id}`,
    DELETE: (id: string) => `/api/customer/${id}`,
    GET: (id: string) => `/api/customer/${id}`,
  },

  // 파일 업로드
  FILES: {
    UPLOAD: "/api/files/upload",
    DELETE: (id: string) => `/api/files/${id}`,
    GET: (id: string) => `/api/files/${id}`,
    DOWNLOAD: (id: string) => `/api/files/${id}/download`,
    GENERATE_VIEW_URL: "/api/files/generateFileViewUrl",
  },
} as const;

export async function checkCompanyName(
  companyName: string
): Promise<CompanyNameCheckResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customer/check/company-name?companyName=${companyName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("업체명 중복 검사 중 오류 발생:", error);
    throw error;
  }
}

// 에러 핸들링 헬퍼 함수
export const handleApiError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);

  if (error?.message?.includes("JWT") || error?.message?.includes("token")) {
    return "인증 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.";
  }

  if (
    error?.message?.includes("network") ||
    error?.message?.includes("fetch")
  ) {
    return "네트워크 연결을 확인해주세요.";
  }

  if (
    error?.message?.includes("404") ||
    error?.message?.includes("not found")
  ) {
    return "데이터를 찾을 수 없습니다.";
  }

  if (error?.message?.includes("409") || error?.message?.includes("conflict")) {
    return "이미 존재하는 데이터입니다.";
  }

  return error?.message || `${operation} 중 오류가 발생했습니다.`;
};

// AWS S3 업로드용 URL을 얻는 함수
export async function getUploadUrls(
  files: Array<{
    category:
      | "BUSINESS_LICENSE"
      | "ELECTRICAL_DIAGRAM"
      | "GOMETA_EXCEL"
      | "INSPECTION_REPORT"
      | "CONTRACT"
      | "SAVINGS_PROOF"
      | "INSURANCE"
      | "KEPCO_APPLICATION"
      | "FEASIBILITY_REPORT"
      | "OTHER";
    extension: string;
    contentType: string;
  }>
): Promise<{
  success: boolean;
  uploadUrls?: Array<{
    fileKey: string;
    uploadUrl: string;
    category: string;
  }>;
  message?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/file/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadUrlReqList: files.map((file) => ({
          category: file.category,
          extension: file.extension,
          contentType: file.contentType,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();

    if (data.status === 200 && data.data?.uploadUrlResList) {
      const uploadUrls = data.data.uploadUrlResList.map(
        (item: any, index: number) => ({
          fileKey: item.fileKey,
          uploadUrl: item.uploadUrl,
          category: files[index].category,
        })
      );

      return {
        success: true,
        uploadUrls,
      };
    } else {
      throw new Error(data.message || "업로드 URL을 가져오는데 실패했습니다.");
    }
  } catch (error) {
    console.error("업로드 URL 요청 중 오류 발생:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

// S3에 직접 파일 업로드하는 함수
export async function uploadToS3(
  file: File,
  uploadUrl: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (response.ok) {
      return { success: true };
    } else {
      throw new Error(`S3 업로드 실패: ${response.status}`);
    }
  } catch (error) {
    console.error("S3 업로드 중 오류 발생:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "S3 업로드에 실패했습니다.",
    };
  }
}
