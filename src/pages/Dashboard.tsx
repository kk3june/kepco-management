import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiResponse, CustomerListItem } from "@/types/database";
import { Building2, HardHat, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeSalesmen: 0,
    totalEngineers: 0,
    inProgressProjects: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<CustomerListItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ADMIN인 경우 전체 통계, 일반 사용자인 경우 담당 수용가 통계
      if (user?.role === "ADMIN") {
        await fetchAdminDashboardData();
      } else {
        await fetchUserDashboardData();
      }
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDashboardData = async () => {
    try {
      // 전체 수용가 목록
      const customersResponse = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.CUSTOMERS.LIST
      );

      // 전체 영업사원 목록
      const salesmenResponse = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.SALES_REPS.LIST
      );

      // 전체 기술사 목록
      const engineersResponse = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.ENGINEERS.LIST
      );

      if (
        customersResponse.data &&
        salesmenResponse.data &&
        engineersResponse.data
      ) {
        const customerList = customersResponse.data.data?.customerList || [];
        const salesmenList =
          salesmenResponse.data.data?.adminSalesmanList || [];
        const engineersList =
          engineersResponse.data.data?.adminEngineerList || [];

        // 진행중인 프로젝트 수 계산 (REQUESTED, IN_PROGRESS 상태)
        const inProgressCount = customerList.filter(
          (customer: any) =>
            customer.progressStatus === "REQUESTED" ||
            customer.progressStatus === "IN_PROGRESS"
        ).length;

        setStats({
          totalCustomers: customerList.length,
          activeSalesmen: salesmenList.length,
          totalEngineers: engineersList.length,
          inProgressProjects: inProgressCount,
        });

        // 최근 수용가 목록 (최대 5개)
        setRecentCustomers(customerList.slice(0, 5));
      }
    } catch (error) {
      console.error("관리자 대시보드 데이터 로딩 실패:", error);
    }
  };

  const fetchUserDashboardData = async () => {
    try {
      // 사용자별 수용가 목록
      const customersResponse = await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.CUSTOMERS.USER_CUSTOMERS
      );

      if (customersResponse.data) {
        const customerList = customersResponse.data.data?.customerList || [];

        // 진행중인 프로젝트 수 계산
        const inProgressCount = customerList.filter(
          (customer: any) =>
            customer.progressStatus === "REQUESTED" ||
            customer.progressStatus === "IN_PROGRESS"
        ).length;

        setStats({
          totalCustomers: customerList.length,
          activeSalesmen: 0, // 사용자별 통계에서는 표시하지 않음
          totalEngineers: 0, // 사용자별 통계에서는 표시하지 않음
          inProgressProjects: inProgressCount,
        });

        // 최근 수용가 목록 (최대 5개)
        setRecentCustomers(customerList.slice(0, 5));
      }
    } catch (error) {
      console.error("사용자 대시보드 데이터 로딩 실패:", error);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      REQUESTED: "의뢰",
      IN_PROGRESS: "진행 중",
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {user?.role === "ADMIN" ? "총 수용가" : "담당 수용가"}
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        {user?.role === "ADMIN" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  영업자
                </CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSalesmen}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  등록 기술사
                </CardTitle>
                <HardHat className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEngineers}</div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              진행 중인 사업
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressProjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 등록된 수용가 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === "ADMIN" ? "최근 등록된 수용가" : "담당 수용가 현황"}
          </CardTitle>
          <CardDescription>
            {user?.role === "ADMIN"
              ? "최근에 등록되거나 업데이트된 고객사 목록입니다."
              : "담당하고 있는 수용가의 최근 현황입니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {user?.role === "ADMIN"
                  ? "등록된 수용가가 없습니다."
                  : "담당하고 있는 수용가가 없습니다."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCustomers.map((customer, index) => (
                <div
                  key={customer.customerId || index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.companyName}
                      </p>
                      <p className="text-sm text-gray-500">
                        담당: {customer.salesmanName || "미배정"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={getStatusColor(
                      customer.progressStatus || "REQUESTED"
                    )}
                  >
                    {getStatusText(customer.progressStatus || "REQUESTED")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
