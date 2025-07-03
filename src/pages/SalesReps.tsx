import { SalesRepForm } from "@/components/SalesRepForm";
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
import { supabase } from "@/lib/supabase";
import { SalesRep } from "@/types/database";
import { Edit, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SalesReps() {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_reps")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sales reps:", error);
        return;
      }

      setSalesReps(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSalesRep(null);
    setIsFormOpen(true);
  };

  const handleEdit = (salesRep: SalesRep) => {
    setEditingSalesRep(salesRep);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 영업자를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabase.from("sales_reps").delete().eq("id", id);

      if (error) {
        console.error("Error deleting sales rep:", error);
        return;
      }

      fetchSalesReps();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFormSubmit = async (
    data: Omit<SalesRep, "id" | "created_at" | "updated_at">
  ) => {
    try {
      if (editingSalesRep) {
        // 수정
        const { error } = await supabase
          .from("sales_reps")
          .update(data)
          .eq("id", editingSalesRep.id);

        if (error) {
          console.error("Error updating sales rep:", error);
          return;
        }
      } else {
        // 생성
        const { error } = await supabase.from("sales_reps").insert([data]);

        if (error) {
          console.error("Error creating sales rep:", error);
          return;
        }
      }

      setIsFormOpen(false);
      setEditingSalesRep(null);
      fetchSalesReps();
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

      {salesReps.length === 0 ? (
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
                {salesReps.map((salesRep) => (
                  <TableRow key={salesRep.id}>
                    <TableCell className="font-medium">
                      {salesRep.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        {salesRep.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {salesRep.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {salesRep.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {salesRep.settlement_method === "invoice"
                        ? "계산서"
                        : "원천징수"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{salesRep.bank_name}</div>
                        <div className="text-gray-500">
                          {salesRep.account_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{salesRep.business_number || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(salesRep)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(salesRep.id)}
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

      <SalesRepForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        salesRep={editingSalesRep}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
