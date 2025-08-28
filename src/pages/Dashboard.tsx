import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { useAuth } from "@/lib/auth";
import { Building2, HardHat, TrendingUp, Users } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();

  // 모든 사용자에게 동일한 통계 데이터 제공
  const stats = [
    {
      title: "총 수용가",
      value: "24",
      icon: Building2,
      description: "전체 등록된 고객사",
      color: "text-blue-600",
    },
    {
      title: "활성 영업자",
      value: "8",
      icon: Users,
      description: "현재 활동 중인 영업자",
      color: "text-green-600",
    },
    {
      title: "등록 기술사",
      value: "5",
      icon: HardHat,
      description: "협력 기술사",
      color: "text-purple-600",
    },
    {
      title: "진행 중인 사업",
      value: "12",
      icon: TrendingUp,
      description: "현재 진행 상태",
      color: "text-orange-600",
    },
  ];

  const recentCustomers = [
    { company: "삼성전자", status: "IN_PROGRESS", salesRep: "김영업" },
    { company: "LG화학", status: "REQUESTED", salesRep: "이영업" },
    { company: "현대자동차", status: "COMPLETE", salesRep: "박영업" },
  ];

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
    };
    return (
      colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

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
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 등록된 수용가 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 등록된 수용가</CardTitle>
          <CardDescription>
            최근에 등록되거나 업데이트된 고객사 목록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCustomers.map((customer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {customer.company}
                    </p>
                    <p className="text-sm text-gray-500">
                      담당: {customer.salesRep}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(customer.status)}>
                  {getStatusText(customer.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
