import { CompanyNameCheckResponse } from "@/types/database";

const API_BASE_URL = import.meta.env.DEV
  ? "" // 개발 환경에서는 프록시 사용
  : "http://ec2-3-36-179-72.ap-northeast-2.compute.amazonaws.com:8080";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
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
    LIST: "/api/home/admin-customer",
    CREATE: "/api/customer",
    UPDATE: (id: string) => `/api/customer/${id}`,
    DELETE: (id: string) => `/api/customer/${id}`,
    GET: (id: string) => `/api/customer/${id}`,
  },

  // 공장 사용량
  FACTORY_USAGE: {
    LIST: "/api/factory-usage",
    CREATE: "/api/factory-usage/register",
    UPDATE: (id: string) => `/api/factory-usage/${id}`,
    DELETE: (id: string) => `/api/factory-usage/${id}`,
    GET: (id: string) => `/api/factory-usage/${id}`,
    BY_CUSTOMER: (customerId: string) =>
      `/api/factory-usage/customer/${customerId}`,
  },

  // 타당성 검토
  FEASIBILITY_STUDIES: {
    LIST: "/api/feasibility-studies",
    CREATE: "/api/feasibility-studies/register",
    UPDATE: (id: string) => `/api/feasibility-studies/${id}`,
    DELETE: (id: string) => `/api/feasibility-studies/${id}`,
    GET: (id: string) => `/api/feasibility-studies/${id}`,
    BY_CUSTOMER: (customerId: string) =>
      `/api/feasibility-studies/customer/${customerId}`,
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

// 파일 조회 URL 생성 함수
export async function generateFileViewUrl(
  fileId: number,
  fileKey: string
): Promise<{ data?: any; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/files/generateFileViewUrl`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: fileId,
          fileKey: fileKey,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("파일 조회 URL 생성 중 오류 발생:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
