import { EngineerForm } from "@/components/EngineerForm";
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
import { Engineer } from "@/types/database";
import { Edit, Mail, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function Engineers() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      const response = await apiClient.get<Engineer[]>(
        API_ENDPOINTS.ENGINEERS.LIST
      );

      if (response.error) {
        console.error("Error fetching engineers:", response.error);
        return;
      }

      setEngineers(response.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEngineer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (engineer: Engineer) => {
    setEditingEngineer(engineer);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 기술사를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.ENGINEERS.DELETE(id)
      );

      if (response.error) {
        console.error("Error deleting engineer:", response.error);
        return;
      }

      fetchEngineers();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFormSubmit = async (
    data: Pick<Engineer, "name" | "phone" | "email" | "address">
  ) => {
    try {
      if (editingEngineer) {
        // 수정
        const response = await apiClient.put(
          API_ENDPOINTS.ENGINEERS.UPDATE(editingEngineer.id),
          data
        );

        if (response.error) {
          console.error("Error updating engineer:", response.error);
          return;
        }
      } else {
        // 생성
        const response = await apiClient.post(
          API_ENDPOINTS.ENGINEERS.CREATE,
          data
        );

        if (response.error) {
          console.error("Error creating engineer:", response.error);
          return;
        }
      }

      setIsFormOpen(false);
      setEditingEngineer(null);
      fetchEngineers();
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
          <h1 className="text-2xl font-bold text-gray-900">기술사 관리</h1>
          <p className="text-gray-600">협력 기술사 정보를 관리합니다.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          기술사 추가
        </Button>
      </div>

      {engineers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">등록된 기술사가 없습니다.</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />첫 기술사 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>기술사 목록</CardTitle>
            <CardDescription>등록된 기술사 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineers.map((engineer) => (
                  <TableRow key={engineer.id}>
                    <TableCell className="font-medium">
                      {engineer.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        {engineer.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {engineer.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start max-w-xs">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-sm truncate">
                          {engineer.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(engineer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(engineer.id)}
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

      <EngineerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        engineer={editingEngineer}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
