import { CustomerForm } from "@/components/CustomerForm";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { API_ENDPOINTS, apiClient, checkCompanyName } from "@/lib/api";
import { ApiResponse, Customer } from "@/types/database";
import { ArrowLeft, Building2, FileText, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<
    (Customer & { customerId: number }) | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id]);

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
        isTenantFactory: editData.tenantFactory ?? customer.tenantFactory,
        januaryElectricUsage:
          editData.januaryElectricUsage ?? customer.januaryElectricUsage,
        augustElectricUsage:
          editData.augustElectricUsage ?? customer.augustElectricUsage,
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

  const handleFormSubmit = async (
    data: Omit<
      Customer,
      "id" | "createdAt" | "updatedAt" | "salesmanId" | "engineerId"
    >
  ) => {
    if (!customer) return;

    try {
      // API 요청에 필요한 형태로 데이터 변환 (API 스펙에 맞게)
      const requestData = {
        companyName: data.companyName,
        representative: data.representative,
        businessNumber: data.businessNumber,
        businessType: data.businessType,
        businessItem: data.businessItem,
        businessAddress: data.businessAddress,
        managerName: data.managerName,
        companyPhone: data.companyPhone,
        email: data.email,
        phoneNumber: data.phoneNumber,
        powerPlannerId: data.powerPlannerId,
        powerPlannerPassword: data.powerPlannerPassword,
        buildingType: data.buildingType,
        isTenantFactory: data.tenantFactory,
        januaryElectricUsage: data.januaryElectricUsage,
        augustElectricUsage: data.augustElectricUsage,
        salesmanId: customer.salesmanId,
        engineerId: customer.engineerId,
        projectCost: data.projectCost,
        electricitySavingRate: data.electricitySavingRate,
        subsidy: data.subsidy,
        projectPeriod: data.projectPeriod,
        progressStatus: data.progressStatus,
        isDelete: false,
        newAttachmentFileList: [],
        deleteAttachmentFileList: [],
      };

      const response = await apiClient.patch(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customerId.toString()),
        requestData
      );

      if (response.error) {
        console.error("Error updating customer:", response.error);
        return;
      }

      setIsFormOpen(false);
      fetchCustomer(customer.customerId.toString());
    } catch (error) {
      console.error("Error:", error);
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
              {isEditing ? (
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
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 기본 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">건물형태</p>
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
                  {isEditing ? (
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
                  {isEditing ? (
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
                  {isEditing ? (
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
                  {isEditing ? (
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
                {isEditing ? (
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
                  {isEditing ? (
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
                {isEditing ? (
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
                {isEditing ? (
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
                {isEditing ? (
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

      {/* 첨부 문서 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            첨부 문서
          </CardTitle>
          <CardDescription>
            수용가 관련 문서를 업로드하고 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUpload
              customerId={customer.customerId}
              documentType="business_license"
              title="사업자 등록증"
              description="사업자 등록증을 업로드해주세요."
            />

            <FileUpload
              customerId={customer.customerId}
              documentType="electrical_diagram"
              title="변전실 도면 (단선결선도)"
              description="변전실 단선결선도를 업로드해주세요."
            />

            <FileUpload
              customerId={customer.customerId}
              documentType="power_usage_data"
              title="전력사용량 데이터 (고메타)"
              description="1월 또는 8월 중 전력사용량이 큰 자료를 업로드해주세요."
            />

            <FileUpload
              customerId={customer.customerId}
              documentType="other"
              title="기타 문서"
              description="기타 필요한 문서를 업로드해주세요."
            />
          </div>
        </CardContent>
      </Card>

      <CustomerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
