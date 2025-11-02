import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import {
  API_ENDPOINTS,
  apiClient,
  checkCompanyName,
  getUploadUrls,
  uploadToS3,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  ApiResponse,
  Customer,
  CustomerFile,
  Engineer,
  EngineerResponse,
  FileUploadRequest,
  LimitUserListResponse,
  Salesman,
  SalesmanResponse,
  TenantCompany,
  UpdateCustomerRequest,
} from "@/types/database";
import { ArrowLeft, Building2, FileText, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function CustomerDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<
    (Customer & { customerId: number }) | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateCustomerRequest>({
    companyName: "",
    representative: "",
    businessNumber: "",
    businessType: "",
    businessItem: "",
    businessAddress: "",
    managerName: "",
    companyPhone: "",
    email: "",
    phoneNumber: "",
    powerPlannerId: "",
    powerPlannerPassword: "",
    buildingType: "FACTORY",
    newTenantCompanyList: [],
    deleteTenantCompanyList: [],
    salesmanId: null,
    engineerId: null,
    projectCost: 0,
    electricitySavingRate: 0,
    subsidy: 0,
    projectPeriod: "",
    progressStatus: "REQUESTED",
    isDelete: false,
    newAttachmentFileList: [],
    deleteAttachmentFileList: [],
    isTenantFactory: false,
  });
  const [showTenantFactoryModal, setShowTenantFactoryModal] = useState(false);
  const [tenantCompanyList, setTenantCompanyList] = useState<TenantCompany[]>(
    []
  );
  const [salesmans, setSalesmans] = useState<Salesman[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [showAddTenantForm, setShowAddTenantForm] = useState(false);
  const [newTenantCompany, setNewTenantCompany] = useState({
    tenantCompanyName: "",
    januaryElectricUsage: "",
    augustElectricUsage: "",
  });
  // 새로운 임차업체와 삭제할 임차업체를 별도로 관리
  const [newTenantCompanies, setNewTenantCompanies] = useState<TenantCompany[]>(
    []
  );
  const [deletedTenantCompanyIds, setDeletedTenantCompanyIds] = useState<
    number[]
  >([]);

  // 문서 타입 정의
  const documentTypes = [
    { code: "BUSINESS_LICENSE", label: "사업자등록증" },
    { code: "ELECTRICAL_DIAGRAM", label: "변전실 도면" },
    { code: "GOMETA_EXCEL", label: "입주사별 전력사용량 자료" },
    { code: "INSPECTION_REPORT", label: "실사 검토 보고서" },
    { code: "CONTRACT", label: "계약서" },
    { code: "SAVINGS_PROOF", label: "전기요금 절감 확인서" },
    { code: "INSURANCE", label: "보증 보험 증권" },
    { code: "KEPCO_APPLICATION", label: "한전 대관 신청서" },
    { code: "FEASIBILITY_REPORT", label: "타당성 검토 보고서" },
    { code: "ETC", label: "기타" },
  ] as const;

  // 문서 타입 코드 타입
  type DocumentTypeCode = (typeof documentTypes)[number]["code"];

  // 사용자의 파일 관리 권한 확인
  const canManageFiles = () => {
    if (!user || !customer) return false;

    // ADMIN은 모든 권한
    if (user.role === "ADMIN") return true;

    // SALESMAN은 자신이 담당하는 수용가에 대해서만 권한
    if (user.role === "SALESMAN") {
      // 담당 영업사원 이름과 현재 로그인한 사용자 username 비교
      return customer.salesmanName === user.username;
    }

    // ENGINEER는 읽기 전용
    if (user.role === "ENGINEER") {
      return false;
    }

    return false;
  };

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
    // ADMIN만 영업사원과 기술사 목록을 가져옴
    if (user?.role === "ADMIN") {
      fetchSalesmans();
      fetchEngineers();
    }
  }, [id, user?.role]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<Customer>>(
        API_ENDPOINTS.CUSTOMERS.GET(customerId)
      );

      if (response.error) {
        console.error("Error fetching customer:", response.error);
        return;
      }

      setCustomer(
        response.data?.data
          ? { ...response.data.data, customerId: parseInt(customerId) }
          : null
      );
      setTenantCompanyList(response.data?.data?.tenantCompanyList || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesmans = async () => {
    try {
      if (user?.role === "ADMIN") {
        // ADMIN은 전체 리스트 조회
        const response = await apiClient.get<ApiResponse<SalesmanResponse>>(
          API_ENDPOINTS.SALES_REPS.LIST
        );
        if (response.data) {
          setSalesmans(response.data.data?.adminSalesmanList || []);
        }
      } else {
        // SALESMAN/ENGINEER는 제한된 리스트 조회
        const response = await apiClient.get<ApiResponse<LimitUserListResponse>>(
          API_ENDPOINTS.SALES_REPS.LIMIT_LIST
        );
        if (response.data) {
          setSalesmans(response.data.data?.limitSalesmanList || []);
        }
      }
    } catch (error) {
      console.error("Error fetching salesmans:", error);
    }
  };

  const fetchEngineers = async () => {
    try {
      if (user?.role === "ADMIN") {
        // ADMIN은 전체 리스트 조회
        const response = await apiClient.get<ApiResponse<EngineerResponse>>(
          API_ENDPOINTS.ENGINEERS.LIST
        );
        if (response.data) {
          setEngineers(response.data.data?.adminEngineerList || []);
        }
      } else {
        // SALESMAN/ENGINEER는 제한된 리스트 조회
        const response = await apiClient.get<ApiResponse<LimitUserListResponse>>(
          API_ENDPOINTS.ENGINEERS.LIMIT_LIST
        );
        if (response.data) {
          setEngineers(response.data.data?.limitEngineerList || []);
        }
      }
    } catch (error) {
      console.error("Error fetching engineers:", error);
    }
  };

  const startEditing = () => {
    if (customer) {
      // 임차공장 리스트 존재 여부에 따라 공장 단독 사용 상태 결정
      const hasTenantCompanies =
        customer.tenantCompanyList && customer.tenantCompanyList.length > 0;
      const isTenantFactory = !hasTenantCompanies; // 임차공장이 있으면 false, 없으면 true

      setEditData({
        companyName: customer.companyName,
        representative: customer.representative,
        businessNumber: customer.businessNumber,
        businessType: customer.businessType,
        businessItem: customer.businessItem,
        businessAddress: customer.businessAddress,
        managerName: customer.managerName,
        companyPhone: customer.companyPhone,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        powerPlannerId: customer.powerPlannerId,
        powerPlannerPassword: customer.powerPlannerPassword,
        buildingType: customer.buildingType,
        newTenantCompanyList: [],
        deleteTenantCompanyList: [],
        salesmanId: customer.salesmanId,
        engineerId: customer.engineerId,
        projectCost: customer.projectCost,
        electricitySavingRate: customer.electricitySavingRate,
        subsidy: customer.subsidy,
        projectPeriod: customer.projectPeriod,
        progressStatus: customer.progressStatus,
        isDelete: false,
        newAttachmentFileList: customer.customerFileList,
        deleteAttachmentFileList: [],
        isTenantFactory: isTenantFactory, // 임차공장 리스트 존재 여부에 따라 설정
      });
      setIsEditing(true);
      setTenantCompanyList(customer.tenantCompanyList);
      // 편집 시작 시 상태 초기화
      setNewTenantCompanies([]);
      setDeletedTenantCompanyIds([]);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    // 편집 취소 시 상태 초기화
    setNewTenantCompanies([]);
    setDeletedTenantCompanyIds([]);
    // 원래 고객 정보로 복원
    if (customer) {
      setTenantCompanyList(customer.tenantCompanyList);
    }
  };

  const handleInputChange = (
    field: keyof UpdateCustomerRequest,
    value: string | number | boolean
  ) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const removeTenantCompany = (customerTenantCompanyId: number) => {
    // 기존 임차업체인 경우 삭제 목록에 추가
    if (customerTenantCompanyId > 0) {
      setDeletedTenantCompanyIds((prev) => [...prev, customerTenantCompanyId]);
    }

    // UI에서 제거
    setTenantCompanyList((prev) =>
      prev.filter(
        (company) => company.customerTenantCompanyId !== customerTenantCompanyId
      )
    );
  };

  const removeNewTenantCompany = (tenantCompanyName: string) => {
    // 새로 추가된 임차업체인 경우 새 목록에서 제거
    setNewTenantCompanies((prev) =>
      prev.filter((company) => company.tenantCompanyName !== tenantCompanyName)
    );

    // UI에서 제거
    setTenantCompanyList((prev) =>
      prev.filter((company) => company.tenantCompanyName !== tenantCompanyName)
    );
  };

  const addTenantCompany = () => {
    if (
      !newTenantCompany.tenantCompanyName ||
      !newTenantCompany.januaryElectricUsage ||
      !newTenantCompany.augustElectricUsage
    ) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    // 임차업체명 중복 검사 (기존 + 새로 추가된 것 모두 체크)
    const allTenantNames = [
      ...tenantCompanyList.map((company) => company.tenantCompanyName),
      ...newTenantCompanies.map((company) => company.tenantCompanyName),
    ];

    if (allTenantNames.includes(newTenantCompany.tenantCompanyName)) {
      alert("이미 등록된 임차업체입니다.");
      return;
    }

    const newTenant: TenantCompany = {
      customerTenantCompanyId: -Date.now(), // 음수로 임시 ID 생성 (기존과 구분)
      tenantCompanyName: newTenantCompany.tenantCompanyName,
      januaryElectricUsage: parseInt(newTenantCompany.januaryElectricUsage),
      augustElectricUsage: parseInt(newTenantCompany.augustElectricUsage),
    };

    // 새 임차업체 목록에 추가
    setNewTenantCompanies((prev) => [...prev, newTenant]);

    // UI에 표시
    setTenantCompanyList((prev) => [...prev, newTenant]);

    // 공장 단독 사용 체크 해제 (임차업체가 추가되었으므로)
    handleInputChange("isTenantFactory", false);

    // 폼 초기화 및 숨기기
    setNewTenantCompany({
      tenantCompanyName: "",
      januaryElectricUsage: "",
      augustElectricUsage: "",
    });
    setShowAddTenantForm(false);
  };

  const cancelAddTenant = () => {
    setShowAddTenantForm(false);
    setNewTenantCompany({
      tenantCompanyName: "",
      januaryElectricUsage: "",
      augustElectricUsage: "",
    });
  };

  const handleTenantFactoryChange = (checked: boolean) => {
    // 현재 임차업체가 존재하는지 확인
    const hasExistingTenants = tenantCompanyList.some(
      (company) => company.customerTenantCompanyId > 0
    );
    const hasNewTenants = newTenantCompanies.length > 0;

    if ((hasExistingTenants || hasNewTenants) && checked) {
      // 임차업체가 존재하는 상태에서 공장 단독 사용을 체크하려는 경우
      setShowTenantFactoryModal(true);
    } else {
      // 임차업체가 없거나 체크를 해제하는 경우
      handleInputChange("isTenantFactory", checked);

      if (checked) {
        // 공장 단독 사용 체크 시 모든 임차업체 초기화
        clearAllTenantCompanies();
      }
    }
  };

  const confirmTenantFactoryChange = () => {
    // 모달에서 확인 버튼을 누른 경우
    handleInputChange("isTenantFactory", true);
    clearAllTenantCompanies();
    setShowTenantFactoryModal(false);
  };

  const clearAllTenantCompanies = () => {
    // 기존 임차업체들을 삭제 목록에 추가
    const existingTenantIds = tenantCompanyList
      .filter((company) => company.customerTenantCompanyId > 0)
      .map((company) => company.customerTenantCompanyId);

    setDeletedTenantCompanyIds((prev) => [...prev, ...existingTenantIds]);

    // 새로 추가된 임차업체들도 초기화
    setNewTenantCompanies([]);

    // UI에서 모든 임차업체 제거
    setTenantCompanyList([]);
  };

  const handleSave = async () => {
    if (!customer || !editData.companyName) return;

    try {
      // 업체명이 변경된 경우 중복 검사
      if (editData.companyName !== customer.companyName) {
        try {
          const checkResponse = await checkCompanyName(editData.companyName);
          if (!checkResponse.data.possible) {
            alert("업체명이 중복되어 수정이 불가능합니다.");
            return;
          }
        } catch (error) {
          console.error("업체명 중복 검사 중 오류:", error);
          alert("업체명 중복 검사 중 오류가 발생했습니다.");
          return;
        }
      }

      // 최종 데이터 구성
      const finalEditData = {
        ...editData,
        newTenantCompanyList: newTenantCompanies,
        deleteTenantCompanyList: deletedTenantCompanyIds,
      };

      const response = await apiClient.patch(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customerId.toString()),
        finalEditData
      );

      if (response.error) {
        console.error("Error updating customer:", response.error);
        alert("수정 중 오류가 발생했습니다.");
        return;
      }

      // 성공 시 고객 정보 새로고침
      await fetchCustomer(customer.customerId.toString());
      setIsEditing(false);
      alert("수정이 완료되었습니다.");
    } catch (error) {
      console.error("Error:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const getBuildingTypeText = (type: string) => {
    const typeMap = {
      FACTORY: "공장",
      KNOWLEDGE_INDUSTRY_CENTER: "지식산업센터",
      BUILDING: "건물",
      MIXED_USE_COMPLEX: "복합단지",
      APARTMENT_COMPLEX: "아파트단지",
      SCHOOL: "학교",
      HOTEL: "호텔",
      ETC: "기타",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (
    file: File,
    documentType: DocumentTypeCode
  ) => {
    if (!customer) return;

    try {
      // 변전실도면과 기타가 아닌 경우 기존 파일이 있으면 사용자에게 안내
      if (documentType !== "ELECTRICAL_DIAGRAM" && documentType !== "ETC") {
        const existingFiles = getFilesByDocumentType(documentType);
        if (existingFiles.length > 0) {
          alert(
            "이 문서 유형은 한 개의 파일만 첨부 가능합니다. 기존 파일을 먼저 삭제한 후 새 파일을 첨부해주세요."
          );
          return;
        }
      }

      // 변전실도면과 기타 최대 5개 제한 체크
      if (documentType === "ELECTRICAL_DIAGRAM" || documentType === "ETC") {
        const existingFiles = getFilesByDocumentType(documentType);
        if (existingFiles.length >= 5) {
          const typeLabel = documentType === "ELECTRICAL_DIAGRAM" ? "변전실 도면" : "기타 문서";
          alert(
            `${typeLabel}은 최대 5개까지 첨부 가능합니다. 기존 파일을 삭제한 후 새 파일을 첨부해주세요.`
          );
          return;
        }
      }

      // 1. 업로드 URL 요청
      const uploadUrlResponse = await getUploadUrls([
        {
          category: documentType,
          extension: file.name.split(".").pop() || "",
          contentType: file.type,
        },
      ]);

      if (!uploadUrlResponse.success || !uploadUrlResponse.uploadUrls) {
        alert("업로드 URL을 가져오는데 실패했습니다.");
        return;
      }

      const uploadUrlData = uploadUrlResponse.uploadUrls[0];

      // 2. S3에 파일 업로드
      const s3UploadResponse = await uploadToS3(file, uploadUrlData.uploadUrl);
      if (!s3UploadResponse.success) {
        alert("파일 업로드에 실패했습니다.");
        return;
      }

      // 3. Customer update API를 통해 파일 정보 추가
      const newAttachmentFile: FileUploadRequest = {
        fileKey: uploadUrlData.fileKey,
        category: documentType,
        originalFileName: file.name,
        extension: file.name.split(".").pop() || "",
        contentType: file.type,
        size: file.size,
      };

      // API 스펙에 맞는 requestData 구조
      const requestData = {
        companyName: customer.companyName,
        representative: customer.representative,
        businessNumber: customer.businessNumber,
        businessType: customer.businessType,
        businessItem: customer.businessItem,
        businessAddress: customer.businessAddress,
        managerName: customer.managerName || "",
        companyPhone: customer.companyPhone,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        powerPlannerId: customer.powerPlannerId,
        powerPlannerPassword: customer.powerPlannerPassword,
        buildingType: customer.buildingType,
        isTenantFactory: customer.tenantFactory,
        newTenantCompanyList: [],
        deleteTenantCompanyList: [],
        salesmanId: customer.salesmanId,
        engineerId: customer.engineerId,
        projectCost: customer.projectCost,
        electricitySavingRate: customer.electricitySavingRate,
        subsidy: customer.subsidy,
        projectPeriod: customer.projectPeriod,
        progressStatus: customer.progressStatus,
        isDelete: false,
        newAttachmentFileList: [newAttachmentFile],
        deleteAttachmentFileList: [],
      };

      const response = await apiClient.patch(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customerId.toString()),
        requestData
      );

      if (response.error) {
        console.error("고객 정보 업데이트 실패:", response.error);
        alert("파일 업로드에 실패했습니다.");
        return;
      }

      // 성공 시 고객 정보 새로고침하여 파일 목록 업데이트
      await fetchCustomer(customer.customerId.toString());
      alert("파일이 성공적으로 업로드되었습니다.");
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    }
  };

  // 파일 삭제 핸들러
  const handleFileDelete = async (fileId: number) => {
    if (!customer) return;

    try {
      // Customer update API를 통해 파일 삭제 정보 추가
      const requestData = {
        companyName: customer.companyName,
        representative: customer.representative,
        businessNumber: customer.businessNumber,
        businessType: customer.businessType,
        businessItem: customer.businessItem,
        businessAddress: customer.businessAddress,
        managerName: customer.managerName || "",
        companyPhone: customer.companyPhone,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        powerPlannerId: customer.powerPlannerId,
        powerPlannerPassword: customer.powerPlannerPassword,
        buildingType: customer.buildingType,
        isTenantFactory: customer.tenantFactory, // 필드명 수정
        newTenantCompanyList: [],
        deleteTenantCompanyList: [],
        salesmanId: customer.salesmanId,
        engineerId: customer.engineerId,
        projectCost: customer.projectCost,
        electricitySavingRate: customer.electricitySavingRate,
        subsidy: customer.subsidy,
        projectPeriod: customer.projectPeriod,
        progressStatus: customer.progressStatus,
        isDelete: false,
        newAttachmentFileList: [],
        deleteAttachmentFileList: [fileId], // fileId 배열
      };

      const response = await apiClient.patch(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customerId.toString()),
        requestData
      );

      if (response.error) {
        console.error("고객 정보 업데이트 실패:", response.error);
        alert("파일 삭제에 실패했습니다.");
        return;
      }

      // 성공 시 고객 정보 새로고침하여 파일 목록 업데이트
      await fetchCustomer(customer.customerId.toString());
      alert("파일이 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("파일 삭제 중 오류:", error);
      alert("파일 삭제 중 오류가 발생했습니다.");
    }
  };

  // 문서 타입별 파일 필터링 함수
  const getFilesByDocumentType = (documentType: string): CustomerFile[] => {
    if (!customer?.customerFileList) return [];
    return customer.customerFileList.filter(
      (file) => file.category === documentType
    );
  };

  // 진행 상태 업데이트 핸들러
  const handleProgressStatusUpdate = async () => {
    if (!customer) return;

    try {
      const requestData = {
        companyName: customer.companyName,
        representative: customer.representative,
        businessNumber: customer.businessNumber,
        businessType: customer.businessType,
        businessItem: customer.businessItem,
        businessAddress: customer.businessAddress,
        managerName: customer.managerName || "",
        companyPhone: customer.companyPhone,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        powerPlannerId: customer.powerPlannerId,
        powerPlannerPassword: customer.powerPlannerPassword,
        buildingType: customer.buildingType,
        isTenantFactory: customer.tenantFactory, // 필드명 수정
        newTenantCompanyList: [],
        deleteTenantCompanyList: [],
        salesmanId: customer.salesmanId,
        engineerId: customer.engineerId,
        projectCost: customer.projectCost,
        electricitySavingRate: customer.electricitySavingRate,
        subsidy: customer.subsidy,
        projectPeriod: customer.projectPeriod,
        progressStatus: customer.progressStatus,
        isDelete: false,
        newAttachmentFileList: [],
        deleteAttachmentFileList: [],
      };

      const response = await apiClient.patch(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customerId.toString()),
        requestData
      );

      if (response.error) {
        console.error("진행 상태 업데이트 실패:", response.error);
        alert("진행 상태 업데이트에 실패했습니다.");
        return;
      }

      alert("진행 상태가 변경되었습니다.");
      await fetchCustomer(customer.customerId.toString());
    } catch (error) {
      console.error("진행 상태 업데이트 중 오류:", error);
      alert("진행 상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">로딩중...</div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">수용가를 찾을 수 없습니다.</p>
        <Button asChild>
          <Link to="/customers">수용가 목록으로</Link>
        </Button>
      </div>
    );
  }

  function getDocumentDescription(documentType: string): string {
    const descriptions: Record<string, string> = {
      BUSINESS_LICENSE: "사업자 등록증을 업로드해주세요.",
      ELECTRICAL_DIAGRAM: "변전실 단선결선도를 업로드해주세요.",
      GOMETA_EXCEL: "1월 또는 8월 중 전력사용량이 큰 자료를 업로드해주세요.",
      INSPECTION_REPORT: "실사 검토 보고서를 업로드해주세요.",
      CONTRACT: "계약서를 업로드해주세요.",
      SAVINGS_PROOF: "전기요금 절감 확인서를 업로드해주세요.",
      INSURANCE: "보증 보험 증권을 업로드해주세요.",
      KEPCO_APPLICATION: "한전 대관 신청서를 업로드해주세요.",
      FEASIBILITY_REPORT: "타당성 검토 보고서를 업로드해주세요.",
      ETC: "기타 관련 문서를 업로드해주세요.",
    };
    return descriptions[documentType] || "문서를 업로드해주세요.";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.companyName}
            </h1>
            <p className="text-gray-600">수용가 상세 정보</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.companyName || customer.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-bold text-gray-900"
                  />
                ) : (
                  customer.companyName
                )}
              </CardTitle>
              <CardDescription>
                대표자:{" "}
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.representative || customer.representative}
                    onChange={(e) =>
                      handleInputChange("representative", e.target.value)
                    }
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                ) : (
                  customer.representative
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* ADMIN과 SALESMAN(담당자인 경우)만 수정 가능 */}
              {canManageFiles() &&
                (isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm">
                      저장
                    </Button>
                    <Button onClick={cancelEditing} variant="outline" size="sm">
                      취소
                    </Button>
                  </>
                ) : (
                  <Button onClick={startEditing} size="sm">
                    수정
                  </Button>
                ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 기본 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500">건물형태</p>
              {isEditing && canManageFiles() ? (
                <select
                  value={editData.buildingType || customer.buildingType}
                  onChange={(e) =>
                    handleInputChange("buildingType", e.target.value)
                  }
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="FACTORY">공장</option>
                  <option value="KNOWLEDGE_INDUSTRY_CENTER">
                    지식산업센터
                  </option>
                  <option value="BUILDING">건물</option>
                  <option value="MIXED_USE_COMPLEX">복합단지</option>
                  <option value="APARTMENT_COMPLEX">아파트단지</option>
                  <option value="SCHOOL">학교</option>
                  <option value="HOTEL">호텔</option>
                  <option value="ETC">기타</option>
                </select>
              ) : (
                <p className="text-sm">
                  {getBuildingTypeText(customer.buildingType)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                사업자등록번호
              </p>
              {isEditing && canManageFiles() ? (
                <input
                  type="text"
                  value={editData.businessNumber || ""}
                  onChange={(e) =>
                    handleInputChange("businessNumber", e.target.value)
                  }
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="text-sm">{customer.businessNumber}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">담당자</p>
              {isEditing && canManageFiles() ? (
                <input
                  type="text"
                  value={editData.managerName || ""}
                  onChange={(e) =>
                    handleInputChange("managerName", e.target.value)
                  }
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="text-sm">{customer.managerName}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">연락처</p>
              {isEditing && canManageFiles() ? (
                <input
                  type="text"
                  value={editData.companyPhone || ""}
                  onChange={(e) =>
                    handleInputChange("companyPhone", e.target.value)
                  }
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="text-sm">{customer.companyPhone}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isEditing && (
                  <>
                    <Checkbox
                      id="singleUse"
                      checked={editData.isTenantFactory}
                      onCheckedChange={handleTenantFactoryChange}
                    />
                    <Label htmlFor="singleUse">공장 단독 사용</Label>
                  </>
                )}
              </div>
              {isEditing && (
                <Button
                  type="button"
                  onClick={() => setShowAddTenantForm(true)}
                  variant="outline"
                  size="sm"
                >
                  임차업체 추가
                </Button>
              )}
            </div>

            {/* 임차업체 추가 폼 */}
            {showAddTenantForm && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-4">
                <h5 className="font-medium text-gray-900 mb-3">
                  새 임차업체 추가
                </h5>
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <input
                      type="text"
                      placeholder="임차업체명"
                      value={newTenantCompany.tenantCompanyName}
                      onChange={(e) =>
                        setNewTenantCompany((prev) => ({
                          ...prev,
                          tenantCompanyName: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="1월 전기사용량"
                      value={newTenantCompany.januaryElectricUsage}
                      onChange={(e) =>
                        setNewTenantCompany((prev) => ({
                          ...prev,
                          januaryElectricUsage: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="8월 전기사용량"
                      value={newTenantCompany.augustElectricUsage}
                      onChange={(e) =>
                        setNewTenantCompany((prev) => ({
                          ...prev,
                          augustElectricUsage: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={addTenantCompany}
                      size="sm"
                      className="h-9 px-3"
                    >
                      추가
                    </Button>
                    <Button
                      type="button"
                      onClick={cancelAddTenant}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!editData.isTenantFactory &&
              tenantCompanyList &&
              tenantCompanyList.length > 0 && (
                <div className="space-y-2">
                  {/* 테이블 헤더 */}
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
                    <div>임차업체명 *</div>
                    <div>1월 전기사용량 (kWh) *</div>
                    <div>8월 전기사용량 (kWh) *</div>
                    <div></div>
                  </div>

                  {/* 테이블 행들 */}
                  {tenantCompanyList.map((company, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-4 items-center"
                    >
                      <>
                        <div className="text-sm py-2">
                          {company.tenantCompanyName}
                        </div>
                        <div className="text-sm py-2">
                          {company.januaryElectricUsage}
                        </div>
                        <div className="text-sm py-2">
                          {company.augustElectricUsage}
                        </div>
                        {isEditing && canManageFiles() && (
                          <Button
                            type="button"
                            onClick={() => {
                              // 새로 추가된 임차업체인지 기존 임차업체인지 구분
                              if (company.customerTenantCompanyId < 0) {
                                removeNewTenantCompany(
                                  company.tenantCompanyName
                                );
                              } else {
                                removeTenantCompany(
                                  company.customerTenantCompanyId
                                );
                              }
                            }}
                            variant="destructive"
                            size="sm"
                            className="h-9 px-3"
                          >
                            삭제
                          </Button>
                        )}
                      </>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* 추가 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">업무 정보</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">업태/업종</p>
                  {isEditing && canManageFiles() ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="업태"
                        value={editData.businessItem || ""}
                        onChange={(e) =>
                          handleInputChange("businessItem", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="업종"
                        value={editData.businessType || ""}
                        onChange={(e) =>
                          handleInputChange("businessType", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-sm">
                      {customer.businessType} / {customer.businessItem}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">사업기간</p>
                  {isEditing && canManageFiles() ? (
                    <input
                      type="text"
                      value={editData.projectPeriod || ""}
                      onChange={(e) =>
                        handleInputChange("projectPeriod", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">
                      {customer.projectPeriod || "미정"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">연락처 정보</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">휴대전화</p>
                  {isEditing && canManageFiles() ? (
                    <input
                      type="text"
                      value={editData.phoneNumber || ""}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{customer.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">이메일</p>
                  {isEditing && canManageFiles() ? (
                    <input
                      type="email"
                      value={editData.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{customer.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 주소 및 한전파워플래너 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">주소</h4>
              <div className="flex items-start">
                <MapPin className="mr-2 h-4 w-4 mt-0.5 text-gray-400" />
                {isEditing && canManageFiles() ? (
                  <input
                    type="text"
                    value={editData.businessAddress || ""}
                    onChange={(e) =>
                      handleInputChange("businessAddress", e.target.value)
                    }
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-sm">{customer.businessAddress}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">한전파워플래너</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">아이디</p>
                  {isEditing && canManageFiles() ? (
                    <input
                      type="text"
                      value={editData.powerPlannerId || ""}
                      onChange={(e) =>
                        handleInputChange("powerPlannerId", e.target.value)
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{customer.powerPlannerId}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">패스워드</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.powerPlannerPassword || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "powerPlannerPassword",
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">
                      {customer.powerPlannerPassword || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 사업 정보 요약 섹션 */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">사업 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">사업비용</p>
                {isEditing && canManageFiles() ? (
                  <input
                    type="number"
                    value={editData.projectCost || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "projectCost",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-lg font-semibold">
                    {customer.projectCost
                      ? new Intl.NumberFormat("ko-KR").format(
                          customer.projectCost
                        ) + "원"
                      : "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  전기요금 절감율
                </p>
                {isEditing && canManageFiles() ? (
                  <input
                    type="number"
                    step="0.1"
                    value={editData.electricitySavingRate || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "electricitySavingRate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-lg font-semibold">
                    {customer.electricitySavingRate
                      ? `${customer.electricitySavingRate}%`
                      : "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">보조금</p>
                {isEditing && canManageFiles() ? (
                  <input
                    type="number"
                    value={editData.subsidy || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "subsidy",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-lg font-semibold">
                    {customer.subsidy
                      ? new Intl.NumberFormat("ko-KR").format(
                          customer.subsidy
                        ) + "원"
                      : "-"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ADMIN과 SALESMAN(담당자인 경우)만 담당자 변경 가능 */}
      {canManageFiles() && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  담당 영업자
                </label>
                <div className="flex space-x-2">
                  <select
                    value={customer?.salesmanId?.toString() || "0"}
                    onChange={(e) => {
                      const newSalesmanId =
                        e.target.value === "0"
                          ? null
                          : parseInt(e.target.value);
                      if (customer) {
                        setCustomer({ ...customer, salesmanId: newSalesmanId });
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-ring transition-colors"
                  >
                    <option value="0" className="py-1">
                      담당자 선택
                    </option>
                    {salesmans.map((rep) => (
                      <option
                        key={rep.id}
                        value={rep.id.toString()}
                        className="py-1"
                      >
                        {rep.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={async () => {
                      if (!customer) return;
                      try {
                        const requestData = {
                          companyName: customer.companyName,
                          representative: customer.representative,
                          businessNumber: customer.businessNumber,
                          businessType: customer.businessType,
                          businessItem: customer.businessItem,
                          businessAddress: customer.businessAddress,
                          managerName: customer.managerName || "",
                          companyPhone: customer.companyPhone,
                          email: customer.email,
                          phoneNumber: customer.phoneNumber,
                          powerPlannerId: customer.powerPlannerId,
                          powerPlannerPassword: customer.powerPlannerPassword,
                          buildingType: customer.buildingType,
                          isTenantFactory: customer.tenantFactory, // 필드명 수정
                          newTenantCompanyList: [],
                          deleteTenantCompanyList: [],
                          salesmanId: customer.salesmanId,
                          engineerId: customer.engineerId,
                          projectCost: customer.projectCost,
                          electricitySavingRate: customer.electricitySavingRate,
                          subsidy: customer.subsidy,
                          projectPeriod: customer.projectPeriod,
                          progressStatus: customer.progressStatus,
                          isDelete: false,
                          newAttachmentFileList: [],
                          deleteAttachmentFileList: [],
                        };

                        const response = await apiClient.patch(
                          API_ENDPOINTS.CUSTOMERS.UPDATE(
                            customer.customerId.toString()
                          ),
                          requestData
                        );

                        if (response.error) {
                          console.error(
                            "Error updating salesman:",
                            response.error
                          );
                          alert("영업사원 변경 중 오류가 발생했습니다.");
                          return;
                        }

                        alert("영업사원이 변경되었습니다.");
                      } catch (error) {
                        console.error("Error:", error);
                        alert("영업사원 변경 중 오류가 발생했습니다.");
                      }
                    }}
                    size="sm"
                    className="h-10 px-3"
                  >
                    변경
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  담당 기술사
                </label>
                <div className="flex space-x-2">
                  <select
                    value={customer?.engineerId?.toString() || "0"}
                    onChange={(e) => {
                      const newEngineerId =
                        e.target.value === "0"
                          ? null
                          : parseInt(e.target.value);
                      if (customer) {
                        setCustomer({ ...customer, engineerId: newEngineerId });
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-ring transition-colors"
                  >
                    <option value="0" className="py-1">
                      기술사 선택
                    </option>
                    {engineers.map((engineer) => (
                      <option
                        key={engineer.id}
                        value={engineer.id.toString()}
                        className="py-1"
                      >
                        {engineer.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={async () => {
                      if (!customer) return;
                      try {
                        const requestData = {
                          companyName: customer.companyName,
                          representative: customer.representative,
                          businessNumber: customer.businessNumber,
                          businessType: customer.businessType,
                          businessItem: customer.businessItem,
                          businessAddress: customer.businessAddress,
                          managerName: customer.managerName || "",
                          companyPhone: customer.companyPhone,
                          email: customer.email,
                          phoneNumber: customer.phoneNumber,
                          powerPlannerId: customer.powerPlannerId,
                          powerPlannerPassword: customer.powerPlannerPassword,
                          buildingType: customer.buildingType,
                          isTenantFactory: customer.tenantFactory, // 필드명 수정
                          newTenantCompanyList: [],
                          deleteTenantCompanyList: [],
                          salesmanId: customer.salesmanId,
                          engineerId: customer.engineerId,
                          projectCost: customer.projectCost,
                          electricitySavingRate: customer.electricitySavingRate,
                          subsidy: customer.subsidy,
                          projectPeriod: customer.projectPeriod,
                          progressStatus: customer.progressStatus,
                          isDelete: false,
                          newAttachmentFileList: [],
                          deleteAttachmentFileList: [],
                        };

                        const response = await apiClient.patch(
                          API_ENDPOINTS.CUSTOMERS.UPDATE(
                            customer.customerId.toString()
                          ),
                          requestData
                        );

                        if (response.error) {
                          console.error(
                            "Error updating engineer:",
                            response.error
                          );
                          alert("기술사 변경 중 오류가 발생했습니다.");
                          return;
                        }

                        alert("기술사가 변경되었습니다.");
                      } catch (error) {
                        console.error("Error:", error);
                        alert("기술사 변경 중 오류가 발생했습니다.");
                      }
                    }}
                    size="sm"
                    className="h-10 px-3"
                  >
                    변경
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 확인 모달 */}
      {showTenantFactoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              공장 단독 사용 설정
            </h3>
            <p className="text-gray-600 mb-6">
              공장 단독 사용으로 설정하면 등록된 모든 임차업체 정보가
              초기화됩니다. 계속하시겠습니까?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowTenantFactoryModal(false)}
              >
                취소
              </Button>
              <Button onClick={confirmTenantFactoryChange}>확인</Button>
            </div>
          </div>
        </div>
      )}

      {/* 첨부 문서 섹션 - 모든 사용자가 볼 수 있음 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                첨부 문서 관리
              </CardTitle>
              <CardDescription>
                수용가 관련 문서를 업로드하고 관리할 수 있습니다.
                {!canManageFiles() && " (읽기 전용)"}
              </CardDescription>
            </div>

            {/* 진행 상태 수정 (권한이 있는 사용자만) */}
            {canManageFiles() && (
              <div className="flex items-center space-x-2">
                <select
                  value={customer.progressStatus || "REQUESTED"}
                  onChange={(e) => {
                    if (customer) {
                      setCustomer({
                        ...customer,
                        progressStatus: e.target.value as any,
                      });
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-ring transition-colors"
                >
                  <option value="REQUESTED">의뢰</option>
                  <option value="IN_PROGRESS">진행중</option>
                  <option value="COMPLETE">완료</option>
                  <option value="REJECTED">반려</option>
                </select>
                <Button
                  onClick={handleProgressStatusUpdate}
                  size="sm"
                  variant="outline"
                >
                  적용
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documentTypes.map((docType) => (
              <FileUpload
                key={docType.code}
                customerId={customer.customerId}
                documentType={docType.code}
                title={docType.label}
                description={getDocumentDescription(docType.code)}
                files={getFilesByDocumentType(docType.code)}
                onFileUpload={(file) => handleFileUpload(file, docType.code)}
                onFileDelete={handleFileDelete}
                readOnly={!canManageFiles()}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
