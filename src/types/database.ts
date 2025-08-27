export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SalesmanRequest {
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  commissionRate: number;
  settlementMethod: "INVOICE" | "WITHHOLDING_TAX";
  bankName: string;
  bankAccount: string;
  businessNumber?: string;
  representative?: string;
  businessItem?: string;
  businessType?: string;
  businessAddress?: string;
}

export interface SalesmanResponse {
  adminSalesmanList: Salesman[];
}

export interface Salesman {
  id: number;
  userId: string;
  userPw: string;
  name: string | null;
  phoneNumber: string;
  email: string;
  address: string;
  commissionRate: number;
  settlementMethod: "INVOICE" | "WITHHOLDING_TAX";
  bankName: string;
  bankAccount: string;
  businessNumber: string;
  business_type: string;
  business_category: string;
  representative: string;
  business_address: string;
}

export interface EngineerRequest {
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}
export interface Engineer {
  id: number;
  userId: string;
  userPw: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
}
export interface EngineerResponse {
  adminEngineerList: Engineer[];
}

export type BuildingType =
  | "FACTORY"
  | "KNOWLEDGE_INDUSTRY_CENTER"
  | "BUILDING"
  | "MIXED_USE_COMPLEX"
  | "APARTMENT_COMPLEX"
  | "SCHOOL"
  | "HOTEL"
  | "OTHER";
export type AcquisitionChannel = "direct" | "website";
export type ProgressStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "REJECTED";

export interface Customer {
  companyName: string;
  representative: string;
  businessNumber: string;
  businessType: string;
  businessItem: string;
  businessAddress: string;
  managerName?: string;
  companyPhone: string;
  email: string;
  phoneNumber: string;
  powerPlannerId: string;
  powerPlannerPassword: string;
  buildingType: BuildingType;
  januaryElectricUsage: number;
  augustElectricUsage: number;
  salesmanId: number | null;
  engineerId: number | null;
  projectCost: number;
  electricitySavingRate: number;
  subsidy: number;
  projectPeriod: string;
  progressStatus: ProgressStatus;
  tenantFactory: boolean;
  createdAt?: string;
  updatedAt?: string;
  customerFileList?: CustomerFile[];
}

export interface AddCustomerRequest extends Customer {
  attachmentFileList: AttachmentFile[];
}

export interface AttachmentFile {
  fileKey: string;
  category: string;
  originalFileName: string;
  extension: string;
  contentType: string;
  size: number;
}

export interface CustomerRequest {
  companyName: string;
  representative: string;
  businessNumber: string;
  businessType: string;
  businessItem: string;
  businessAddress: string;
  managerName: string;
  companyPhone: string;
  email: string;
  phoneNumber: string;
  powerPlannerId: string;
  powerPlannerPassword: string;
  buildingType: BuildingType;
  isTenantFactory: boolean;
  januaryElectricUsage: number;
  augustElectricUsage: number;
  salesmanId: number | null;
  engineerId: number | null;
  projectCost: number;
  electricitySavingRate: number;
  subsidy: number;
  projectPeriod: string;
  progressStatus: ProgressStatus;
  isDelete: boolean;
  newAttachmentFileList: AttachmentFile[];
  deleteAttachmentFileList: number[];
}
export interface CustomerResponse {
  customerList: CustomerListItem[];
}

export interface CustomerListItem {
  customerId: number;
  companyName: string;
  representative: string;
  buildingType: BuildingType;
  salesmanName: string | null;
  engineerName: string | null;
  progressStatus: ProgressStatus | null;
  companyPhone: string;
  companyEmail: string;
}
export interface FactoryUsage {
  id: string;
  customer_id: string;
  factory_name: string;
  january_usage: number;
  august_usage: number;
  created_at: string;
  updated_at: string;
}

// 파일 첨부 관리를 위한 새 테이블
export interface CustomerDocument {
  id: string;
  customer_id: number;
  document_type:
    | "business_license"
    | "electrical_diagram"
    | "power_usage_data"
    | "other";
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// 타당성 검토 의뢰서 정보
export interface FeasibilityStudy {
  id: string;
  customer_id: string;
  // 기본 정보는 Customer 테이블에서 참조

  // 검토 요청 정보
  request_date: string;
  target_completion_date?: string;
  project_description?: string;
  expected_cost_reduction?: number;

  // 승인/반려 정보
  status: "pending" | "approved" | "rejected" | "in_review";
  reviewer_id?: string;
  review_date?: string;
  review_comments?: string;

  created_at: string;
  updated_at: string;
}

export interface CompanyNameCheckResponse {
  status: number;
  message: string;
  data: {
    possible: boolean;
    salesmanName: string | null;
    salesmanPhoneNumber: string | null;
    salesmanEmail: string | null;
  };
}

// Supabase Database 타입
export interface Database {
  public: {
    Tables: {
      salesmen: {
        Row: Salesman;
        Insert: Omit<Salesman, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Salesman, "id" | "created_at" | "updated_at">>;
      };
      engineers: {
        Row: Engineer;
        Insert: Omit<Engineer, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Engineer, "id" | "created_at" | "updated_at">>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<
          Customer,
          "id" | "created_at" | "updated_at" | "sales_rep" | "engineer"
        >;
        Update: Partial<
          Omit<
            Customer,
            "id" | "created_at" | "updated_at" | "sales_rep" | "engineer"
          >
        >;
      };
      factory_usage: {
        Row: FactoryUsage;
        Insert: Omit<FactoryUsage, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FactoryUsage, "id" | "created_at" | "updated_at">>;
      };
      customer_documents: {
        Row: CustomerDocument;
        Insert: Omit<CustomerDocument, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<CustomerDocument, "id" | "created_at" | "updated_at">
        >;
      };
      feasibility_studies: {
        Row: FeasibilityStudy;
        Insert: Omit<FeasibilityStudy, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<FeasibilityStudy, "id" | "created_at" | "updated_at">
        >;
      };
    };
  };
}

export interface CustomerFile {
  fileId: number;
  fileKey: string;
  category: string;
  originalFileName: string;
  extension: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface FileViewUrlResponse {
  fileViewUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}
