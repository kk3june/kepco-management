export interface SalesRep {
  id: string;
  name: string;
  phone: string;
  email: string;
  commission_rate: number; // %
  address: string;
  settlement_method: "invoice" | "withholding"; // 계산서/원천징수
  bank_name: string;
  account_number: string;
  // 선택 필드
  business_number?: string;
  business_type?: string;
  business_category?: string;
  representative?: string;
  business_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Engineer {
  id: string;
  name: string;
  phone: string;
  email: string;
  commission_rate: number; // %
  address: string;
  settlement_method: "invoice" | "withholding"; // 계산서/원천징수
  bank_name: string;
  account_number: string;
  // 선택 필드
  business_number?: string;
  business_type?: string;
  business_category?: string;
  representative?: string;
  business_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Engineer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export type BuildingType =
  | "factory"
  | "mixed_building"
  | "office"
  | "residential";
export type AcquisitionChannel = "direct" | "website";
export type ProgressStatus =
  | "feasibility" // 타당성 검토
  | "survey" // 실사
  | "report" // 실사보고서
  | "contract" // 계약
  | "construction" // 시공
  | "confirmation" // 사업확인서
  | "settlement"; // 수수료 정산

export interface Customer {
  id: string;
  company_name: string;
  representative: string;
  business_number: string;
  business_type: string;
  business_category: string;
  business_address: string;
  contact_name: string;
  company_phone: string;
  email: string;
  mobile_phone: string;
  kepco_planner_id: string;
  kepco_planner_password: string;
  building_type: BuildingType;

  // 관계 필드
  sales_rep_id: string;
  engineer_id: string;

  // 사업 정보
  acquisition_channel: AcquisitionChannel;
  progress_status: ProgressStatus;
  project_cost?: number;
  power_saving_rate?: number;
  kepco_payment?: number;
  project_period?: string;
  notes?: string;

  created_at: string;
  updated_at: string;

  // 조인된 데이터
  sales_rep?: SalesRep;
  engineer?: Engineer;
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
  customer_id: string;
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

// Supabase Database 타입
export interface Database {
  public: {
    Tables: {
      sales_reps: {
        Row: SalesRep;
        Insert: Omit<SalesRep, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SalesRep, "id" | "created_at" | "updated_at">>;
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
