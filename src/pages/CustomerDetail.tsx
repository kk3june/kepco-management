import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
  Salesman,
  SalesmanResponse,
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
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [salesmans, setSalesmans] = useState<Salesman[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);

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
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesmans = async () => {
    try {
      const response = await apiClient.get<ApiResponse<SalesmanResponse>>(
        API_ENDPOINTS.SALES_REPS.LIST
      );
      if (response.data) {
        setSalesmans(response.data.data?.adminSalesmanList || []);
      }
    } catch (error) {
      console.error("Error fetching salesmans:", error);
    }
  };

  const fetchEngineers = async () => {
    try {
      const response = await apiClient.get<ApiResponse<EngineerResponse>>(
        API_ENDPOINTS.ENGINEERS.LIST
      );
      if (response.data) {
        setEngineers(response.data.data?.adminEngineerList || []);
      }
    } catch (error) {
      console.error("Error fetching engineers:", error);
    }
  };

  const startEditing = () => {
    if (customer) {
      setEditData(customer);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleInputChange = (
    field: keyof Customer,
    value: string | number | boolean
  ) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
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

      // API 요청에 필요한 데이터를 API 스펙에 맞게 준비
      const requestData = {
        companyName: editData.companyName || customer.companyName,
        representative: editData.representative || customer.representative,
        businessNumber: editData.businessNumber || customer.businessNumber,
        businessType: editData.businessType || customer.businessType,
        businessItem: editData.businessItem || customer.businessItem,
        businessAddress: editData.businessAddress || customer.businessAddress,
        managerName: editData.managerName || customer.managerName,
        companyPhone: editData.companyPhone || customer.companyPhone,
        email: editData.email || customer.email,
        phoneNumber: editData.phoneNumber || customer.phoneNumber,
        powerPlannerId: editData.powerPlannerId || customer.powerPlannerId,
        powerPlannerPassword:
          editData.powerPlannerPassword || customer.powerPlannerPassword,
        buildingType: editData.buildingType || customer.buildingType,
        tenantFactory: editData.tenantFactory ?? customer.tenantFactory,
        newTenantCompanyList: [],
        deleteTenantCompanyList: [],
        salesmanId: customer.salesmanId,
        engineerId: customer.engineerId,
        projectCost: editData.projectCost ?? customer.projectCost,
        electricitySavingRate:
          editData.electricitySavingRate ?? customer.electricitySavingRate,
        subsidy: editData.subsidy ?? customer.subsidy,
        projectPeriod: editData.projectPeriod || customer.projectPeriod,
        progressStatus: editData.progressStatus || customer.progressStatus,
        isDelete: false, // 기본값으로 false 설정
        newAttachmentFileList: [], // 현재는 빈 배열로 전송
        deleteAttachmentFileList: [], // 현재는 빈 배열로 전송
      };

      const response = await apiClient.patch(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customerId.toString()),
        requestData
      );

      if (response.error) {
        console.error("Error updating customer:", response.error);
        alert("수정 중 오류가 발생했습니다.");
        return;
      }

      // 성공 시 고객 정보 새로고침
      await fetchCustomer(customer.customerId.toString());
      setIsEditing(false);
      setEditData({});
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
      OTHER: "기타",
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
        tenantFactory: customer.tenantFactory,
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
        ...customer,
        isDelete: false,
        newAttachmentFileList: [],
        deleteAttachmentFileList: [fileId],
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <option value="OTHER">기타</option>
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

          {/* 추가 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">업무 정보</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">업종/업태</p>
                  {isEditing && canManageFiles() ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="업종"
                        value={editData.businessType || ""}
                        onChange={(e) =>
                          handleInputChange("businessType", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="업태"
                        value={editData.businessItem || ""}
                        onChange={(e) =>
                          handleInputChange("businessItem", e.target.value)
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
                      type="password"
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
                    <p className="text-sm">••••••••</p>
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
                          ...customer,
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
                          ...customer,
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

      {/* 첨부 문서 섹션 - 모든 사용자가 볼 수 있음 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            첨부 문서 관리
          </CardTitle>
          <CardDescription>
            수용가 관련 문서를 업로드하고 관리할 수 있습니다.
            {!canManageFiles() && " (읽기 전용)"}
          </CardDescription>
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
