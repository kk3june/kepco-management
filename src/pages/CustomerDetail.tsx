import { CustomerForm } from "@/components/CustomerForm";
import { FactoryUsageForm } from "@/components/FactoryUsageForm";
import { FeasibilityStudyForm } from "@/components/FeasibilityStudyForm";
import { FileUpload } from "@/components/FileUpload";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { Customer } from "@/types/database";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFeasibilityOpen, setIsFeasibilityOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await apiClient.get<Customer>(
        API_ENDPOINTS.CUSTOMERS.GET(customerId)
      );

      if (response.error) {
        console.error("Error fetching customer:", response.error);
        return;
      }

      setCustomer(response.data || null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (
    data: Omit<
      Customer,
      "id" | "created_at" | "updated_at" | "sales_rep" | "engineer"
    >
  ) => {
    if (!customer) return;

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.CUSTOMERS.UPDATE(customer.id),
        data
      );

      if (response.error) {
        console.error("Error updating customer:", response.error);
        return;
      }

      setIsFormOpen(false);
      fetchCustomer(customer.id);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      feasibility: "타당성 검토",
      survey: "실사",
      report: "실사보고서",
      contract: "계약",
      construction: "시공",
      confirmation: "사업확인서",
      settlement: "수수료 정산",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      feasibility: "bg-gray-100 text-gray-800",
      survey: "bg-blue-100 text-blue-800",
      report: "bg-yellow-100 text-yellow-800",
      contract: "bg-green-100 text-green-800",
      construction: "bg-purple-100 text-purple-800",
      confirmation: "bg-indigo-100 text-indigo-800",
      settlement: "bg-emerald-100 text-emerald-800",
    };
    return (
      colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

  const getBuildingTypeText = (type: string) => {
    const typeMap = {
      factory: "공장",
      mixed_building: "집합건물",
      office: "사옥",
      residential: "주상복합/아파트",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
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
              {customer.company_name}
            </h1>
            <p className="text-gray-600">수용가 상세 정보</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsFeasibilityOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            타당성 검토
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                {customer.company_name}
              </CardTitle>
              <CardDescription>
                대표자: {customer.representative}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(customer.progress_status)}>
              {getStatusText(customer.progress_status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">건물형태</p>
              <p className="text-sm">
                {getBuildingTypeText(customer.building_type)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">가입경로</p>
              <p className="text-sm">
                {customer.acquisition_channel === "direct" ? "직영" : "사이트"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                사업자등록번호
              </p>
              <p className="text-sm">{customer.business_number}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="contact">연락처</TabsTrigger>
          <TabsTrigger value="project">사업 정보</TabsTrigger>
          <TabsTrigger value="team">담당자</TabsTrigger>
          {customer.building_type === "factory" && (
            <TabsTrigger value="factory">공장 정보</TabsTrigger>
          )}
          <TabsTrigger value="documents">첨부 문서</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        업체명
                      </p>
                      <p className="text-sm">{customer.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        대표자
                      </p>
                      <p className="text-sm">{customer.representative}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        사업자등록번호
                      </p>
                      <p className="text-sm">{customer.business_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        업종/업태
                      </p>
                      <p className="text-sm">
                        {customer.business_type} / {customer.business_category}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">주소</h4>
                  <div className="flex items-start">
                    <MapPin className="mr-2 h-4 w-4 mt-0.5 text-gray-400" />
                    <p className="text-sm">{customer.business_address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>연락처 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    담당자 연락처
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        담당자명
                      </p>
                      <p className="text-sm">{customer.contact_name}</p>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          회사전화
                        </p>
                        <p className="text-sm">{customer.company_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          휴대전화
                        </p>
                        <p className="text-sm">{customer.mobile_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          이메일
                        </p>
                        <p className="text-sm">{customer.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    한전파워플래너
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        아이디
                      </p>
                      <p className="text-sm">{customer.kepco_planner_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        패스워드
                      </p>
                      <p className="text-sm">••••••••</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>사업 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">사업비용</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(customer.project_cost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    전기요금 절감율
                  </p>
                  <p className="text-lg font-semibold">
                    {customer.power_saving_rate
                      ? `${customer.power_saving_rate}%`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    한전수불금
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(customer.kepco_payment)}
                  </p>
                </div>
              </div>

              {customer.project_period && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">사업기간</p>
                  <p className="text-sm">{customer.project_period}</p>
                </div>
              )}

              {customer.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">비고</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 영업자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  담당 영업자
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.sales_rep ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{customer.sales_rep.name}</p>
                      <p className="text-sm text-gray-500">
                        수수료율: {customer.sales_rep.commission_rate}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        {customer.sales_rep.phone}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {customer.sales_rep.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    담당 영업자가 지정되지 않았습니다.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 기술사 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  담당 기술사
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.engineer ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{customer.engineer.name}</p>
                      <p className="text-sm text-gray-500">기술사</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        {customer.engineer.phone}
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {customer.engineer.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    담당 기술사가 지정되지 않았습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {customer.building_type === "factory" && (
          <TabsContent value="factory" className="space-y-4">
            <FactoryUsageForm
              customerId={customer.id}
              buildingType={customer.building_type}
              onChange={() => {
                // 공장 데이터 업데이트 후 필요한 작업
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUpload
              customerId={customer.id}
              documentType="business_license"
              title="사업자 등록증"
              description="사업자 등록증을 업로드해주세요."
            />

            <FileUpload
              customerId={customer.id}
              documentType="electrical_diagram"
              title="변전실 도면 (단선결선도)"
              description="변전실 단선결선도를 업로드해주세요."
            />

            <FileUpload
              customerId={customer.id}
              documentType="power_usage_data"
              title="전력사용량 데이터 (고메타)"
              description="1월 또는 8월 중 전력사용량이 큰 자료를 업로드해주세요."
            />

            <FileUpload
              customerId={customer.id}
              documentType="other"
              title="기타 문서"
              description="기타 필요한 문서를 업로드해주세요."
            />
          </div>
        </TabsContent>
      </Tabs>

      <CustomerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={customer}
        onSubmit={handleFormSubmit}
      />

      <FeasibilityStudyForm
        open={isFeasibilityOpen}
        onOpenChange={setIsFeasibilityOpen}
        customerId={customer.id}
        customerName={customer.company_name}
      />
    </div>
  );
}
