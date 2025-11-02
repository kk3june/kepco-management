import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CustomerForm } from "@/components/CustomerForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { API_ENDPOINTS, apiClient, checkCompanyName } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import {
  AddCustomerRequest,
  ApiResponse,
  BuildingType,
  CustomerListItem,
  CustomerResponse,
} from "@/types/database";
import { Building2, Eye, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    customerId: string | null;
    customerName: string;
  }>({
    isOpen: false,
    customerId: null,
    customerName: "",
  });

  // 사용자가 수용가를 관리할 수 있는 권한 확인
  const canManageCustomer = (customer: CustomerListItem) => {
    if (!user) return false;

    // ADMIN은 모든 권한
    if (user.role === "ADMIN") return true;

    // SALESMAN은 자신이 담당하는 수용가에 대해서만 권한
    if (user.role === "SALESMAN") {
      return customer.salesmanName === user.username;
    }

    // ENGINEER는 권한 없음
    return false;
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      let endpoint = API_ENDPOINTS.CUSTOMERS.LIST;

      // salesman이나 engineer인 경우 자신이 담당하는 수용가만 조회
      if (user?.role === "SALESMAN" || user?.role === "ENGINEER") {
        endpoint = API_ENDPOINTS.CUSTOMERS.USER_CUSTOMERS;
      }

      const response = await apiClient.get<ApiResponse<CustomerResponse>>(
        endpoint
      );

      if (response.error) {
        console.error("Error fetching customers:", response.error);
        return;
      }

      setCustomers(response.data?.data?.customerList || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string, customerName: string) => {
    setDeleteDialog({
      isOpen: true,
      customerId: id,
      customerName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.customerId) return;

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.CUSTOMERS.DELETE(deleteDialog.customerId)
      );

      if (response.error) {
        console.error("Error deleting customer:", response.error);
        toast({
          title: "삭제 실패",
          description: `수용가 삭제 중 오류가 발생했습니다: ${response.error}`,
          variant: "destructive",
        });
        return;
      }
      // 성공 메시지 표시
      toast({
        title: "삭제 완료",
        description: "수용가가 성공적으로 삭제되었습니다.",
        variant: "default",
      });
      fetchCustomers();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "삭제 실패",
        description: "수용가 삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (data: AddCustomerRequest) => {
    try {
      // 수용가명 중복 체크
      const duplicateCheck = await checkCompanyName(data.companyName);

      if (!duplicateCheck.data.possible) {
        // 중복된 경우 alert 창 표시
        alert(
          `업체명 "${
            data.companyName
          }"이(가) 이미 존재합니다.\n\n담당 영업사원: ${
            duplicateCheck.data.salesmanName || "정보 없음"
          }\n연락처: ${
            duplicateCheck.data.salesmanPhoneNumber || "정보 없음"
          }\n이메일: ${duplicateCheck.data.salesmanEmail || "정보 없음"}`
        );
        return;
      }

      // 중복되지 않은 경우 수용가 생성 API 호출
      const response = await apiClient.post(
        API_ENDPOINTS.CUSTOMERS.CREATE,
        data
      );

      if (response.error) {
        console.error("Error creating customer:", response.error);
        toast({
          title: "생성 실패",
          description: "수용가 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "생성 완료",
        description: "수용가가 성공적으로 생성되었습니다.",
        variant: "default",
      });
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "생성 실패",
        description: "수용가 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      REQUESTED: "의뢰",
      IN_PROGRESS: "진행중",
      COMPLETE: "완료",
      REJECTED: "반려",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      REQUESTED: "bg-gray-100 text-gray-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETE: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      FEASIBILITY: "bg-yellow-100 text-yellow-800",
      SURVEY: "bg-orange-100 text-orange-800",
      REPORT: "bg-purple-100 text-purple-800",
      CONTRACT: "bg-indigo-100 text-indigo-800",
      CONSTRUCTION: "bg-pink-100 text-pink-800",
      CONFIRMATION: "bg-teal-100 text-teal-800",
      SETTLEMENT: "bg-emerald-100 text-emerald-800",
    };
    return (
      colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

  const getBuildingTypeText = (type: BuildingType) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">로딩중...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">수용가 관리</h1>
          <p className="text-gray-600">
            {user?.role === "ADMIN"
              ? "전기공사 고객사를 관리합니다."
              : "담당하고 있는 수용가 목록입니다."}
          </p>
        </div>
        {/* ADMIN과 SALESMAN만 수용가 추가 버튼 표시 */}
        {(user?.role === "ADMIN" || user?.role === "SALESMAN") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            수용가 추가
          </Button>
        )}
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {user?.role === "ADMIN"
                ? "등록된 수용가가 없습니다."
                : "담당하고 있는 수용가가 없습니다."}
            </p>
            {(user?.role === "ADMIN" || user?.role === "SALESMAN") && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />첫 수용가 추가하기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>수용가 목록</CardTitle>
            <CardDescription>
              {user?.role === "ADMIN"
                ? "등록된 수용가 목록입니다. 상세보기를 클릭하여 자세한 정보를 확인할 수 있습니다."
                : "담당하고 있는 수용가 목록입니다. 상세보기를 클릭하여 자세한 정보를 확인할 수 있습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>업체명</TableHead>
                  <TableHead>대표자</TableHead>
                  <TableHead>건물형태</TableHead>
                  <TableHead>담당 영업자</TableHead>
                  <TableHead>담당 기술사</TableHead>
                  <TableHead>진행상황</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={customer.customerId || `temp-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                        {customer.companyName}
                      </div>
                    </TableCell>
                    <TableCell>{customer.representative}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getBuildingTypeText(customer.buildingType || "")}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.salesmanName || "-"}</TableCell>
                    <TableCell>{customer.engineerName || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(
                          customer.progressStatus || ""
                        )}
                      >
                        {getStatusText(customer.progressStatus || "")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3" />
                          {customer.companyPhone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="mr-1 h-3 w-3" />
                          {customer.companyEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/customers/${customer.customerId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {/* ADMIN과 SALESMAN(담당자인 경우)만 삭제 버튼 표시 */}
                        {canManageCustomer(customer) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteClick(
                                customer.customerId.toString(),
                                customer.companyName || "수용가"
                              )
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ADMIN과 SALESMAN만 수용가 추가 폼 표시 */}
      {(user?.role === "ADMIN" || user?.role === "SALESMAN") && (
        <CustomerForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({
            isOpen: false,
            customerId: null,
            customerName: "",
          })
        }
        onConfirm={handleDeleteConfirm}
        title="수용가 삭제 확인"
        description={`"${deleteDialog.customerName}" 수용가를 정말로 삭제하시겠습니까?\n\n삭제된 데이터는 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
      />
    </div>
  );
}
