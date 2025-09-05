import { SalesmanForm } from "@/components/SalesmanForm";
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
import { API_ENDPOINTS, apiClient, ApiResponse } from "@/lib/api";
import { Salesman, SalesmanRequest, SalesmanResponse } from "@/types/database";
import { Edit, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function Salesmans() {
  const [salesmans, setSalesmans] = useState<Salesman[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesmans();
  }, []);

  const fetchSalesmans = async () => {
    try {
      const response = await apiClient.get<ApiResponse<SalesmanResponse>>(
        API_ENDPOINTS.SALES_REPS.LIST
      );

      if (response.error) {
        console.error("Error fetching sales reps:", response.error);
        return;
      }

      setSalesmans(response.data?.data?.adminSalesmanList || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSalesman(null);
    setIsFormOpen(true);
  };

  const handleEdit = (salesRep: Salesman) => {
    setEditingSalesman(salesRep);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 영업자를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.SALES_REPS.DELETE(id)
      );

      if (response.error) {
        console.error("Error deleting sales rep:", response.error);
        return;
      }

      fetchSalesmans();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFormSubmit = async (data: SalesmanRequest) => {
    try {
      if (editingSalesman) {
        // 수정 - updateSalesman API 구조에 맞춰 변환
        const updateData = {
          username: data.username, // 폼에서 입력한 아이디 사용
          password: data.password, // 폼에서 입력한 비밀번호 사용
          salesmanName: data.name,
          salesmanPhone: data.phone,
          salesmanEmail: data.email,
          salesmanAddress: data.address,
          commissionRate: data.commissionRate,
          settlementMethod: data.settlementMethod,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          businessNumber: data.businessNumber,
          representative: data.representative,
          businessItem: data.businessItem,
          businessType: data.businessType,
          businessAddress: data.businessAddress,
        };

        const response = await apiClient.put(
          API_ENDPOINTS.SALES_REPS.UPDATE(editingSalesman.id.toString()),
          updateData
        );

        if (response.error) {
          console.error("Error updating sales rep:", response.error);
          return;
        }
      } else {
        // 생성 - SalesmanRequest 타입 그대로 사용
        const response = await apiClient.post(
          API_ENDPOINTS.SALES_REPS.CREATE,
          data
        );

        if (response.error) {
          console.error("Error creating sales rep:", response.error);
          return;
        }
      }

      setIsFormOpen(false);
      setEditingSalesman(null);
      fetchSalesmans();
    } catch (error) {
      console.error("Error:", error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">영업자 관리</h1>
          <p className="text-gray-600">영업자 정보를 관리합니다.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          영업자 추가
        </Button>
      </div>

      {salesmans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">등록된 영업자가 없습니다.</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />첫 영업자 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>영업자 목록</CardTitle>
            <CardDescription>등록된 영업자 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>수수료율</TableHead>
                  <TableHead>정산방법</TableHead>
                  <TableHead>은행정보</TableHead>
                  <TableHead>사업자번호</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesmans.map((salesman) => (
                  <TableRow key={salesman.id}>
                    <TableCell className="font-medium">
                      {salesman.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        {salesman.phoneNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {salesman.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {salesman.commissionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {salesman.settlementMethod === "INVOICE"
                        ? "계산서"
                        : "원천징수"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{salesman.bankName}</div>
                        <div className="text-gray-500">
                          {salesman.bankAccount}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{salesman.businessNumber || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(salesman)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(salesman.id.toString())}
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

      <SalesmanForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        salesman={editingSalesman}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
