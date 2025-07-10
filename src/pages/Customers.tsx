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
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { Customer } from "@/types/database";
import { Building2, Edit, Eye, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get<Customer[]>(
        API_ENDPOINTS.CUSTOMERS.LIST
      );

      if (response.error) {
        console.error("Error fetching customers:", response.error);
        return;
      }

      setCustomers(response.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 수용가를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.CUSTOMERS.DELETE(id)
      );

      if (response.error) {
        console.error("Error deleting customer:", response.error);
        return;
      }

      fetchCustomers();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFormSubmit = async (
    data: Omit<
      Customer,
      "id" | "created_at" | "updated_at" | "sales_rep" | "engineer"
    >
  ) => {
    try {
      if (editingCustomer) {
        // 수정
        const response = await apiClient.put(
          API_ENDPOINTS.CUSTOMERS.UPDATE(editingCustomer.id),
          data
        );

        if (response.error) {
          console.error("Error updating customer:", response.error);
          return;
        }
      } else {
        // 생성
        const response = await apiClient.post(
          API_ENDPOINTS.CUSTOMERS.CREATE,
          data
        );

        if (response.error) {
          console.error("Error creating customer:", response.error);
          return;
        }
      }

      setIsFormOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
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
          <p className="text-gray-600">전기공사 고객사를 관리합니다.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          수용가 추가
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">등록된 수용가가 없습니다.</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />첫 수용가 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>수용가 목록</CardTitle>
            <CardDescription>
              등록된 수용가 목록입니다. 상세보기를 클릭하여 자세한 정보를 확인할
              수 있습니다.
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
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                        {customer.company_name}
                      </div>
                    </TableCell>
                    <TableCell>{customer.representative}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getBuildingTypeText(customer.building_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.sales_rep?.name || "-"}</TableCell>
                    <TableCell>{customer.engineer?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(customer.progress_status)}
                      >
                        {getStatusText(customer.progress_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="mr-1 h-3 w-3" />
                          {customer.mobile_phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="mr-1 h-3 w-3" />
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CustomerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editingCustomer}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
