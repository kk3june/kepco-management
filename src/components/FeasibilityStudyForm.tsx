import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { FeasibilityStudy } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const feasibilityStudySchema = z.object({
  request_date: z.string().min(1, "신청일을 입력해주세요"),
  target_completion_date: z.string().optional(),
  project_description: z.string().optional(),
  expected_cost_reduction: z.number().optional(),
  status: z.enum(["pending", "approved", "rejected", "in_review"]),
  review_comments: z.string().optional(),
});

type FeasibilityStudyFormData = z.infer<typeof feasibilityStudySchema>;

interface FeasibilityStudyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

export function FeasibilityStudyForm({
  open,
  onOpenChange,
  customerId,
  customerName,
}: FeasibilityStudyFormProps) {
  const [feasibilityStudy, setFeasibilityStudy] =
    useState<FeasibilityStudy | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FeasibilityStudyFormData>({
    resolver: zodResolver(feasibilityStudySchema),
    defaultValues: {
      request_date: new Date().toISOString().split("T")[0],
      target_completion_date: "",
      project_description: "",
      expected_cost_reduction: undefined,
      status: "pending",
      review_comments: "",
    },
  });

  useEffect(() => {
    if (open && customerId) {
      fetchFeasibilityStudy();
    }
  }, [open, customerId]);

  const fetchFeasibilityStudy = async () => {
    try {
      const response = await apiClient.get<FeasibilityStudy>(
        API_ENDPOINTS.FEASIBILITY_STUDIES.BY_CUSTOMER(customerId)
      );

      if (response.error) {
        console.error("Error fetching feasibility study:", response.error);
        return;
      }

      if (response.data) {
        setFeasibilityStudy(response.data);
        form.reset({
          request_date: response.data.request_date,
          target_completion_date: response.data.target_completion_date || "",
          project_description: response.data.project_description || "",
          expected_cost_reduction: response.data.expected_cost_reduction,
          status: response.data.status,
          review_comments: response.data.review_comments || "",
        });
      } else {
        setFeasibilityStudy(null);
        form.reset({
          request_date: new Date().toISOString().split("T")[0],
          target_completion_date: "",
          project_description: "",
          expected_cost_reduction: undefined,
          status: "pending",
          review_comments: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (data: FeasibilityStudyFormData) => {
    setLoading(true);
    try {
      const submitData = {
        customer_id: customerId,
        request_date: data.request_date,
        target_completion_date: data.target_completion_date || null,
        project_description: data.project_description || null,
        expected_cost_reduction: data.expected_cost_reduction || null,
        status: data.status,
        review_comments: data.review_comments || null,
      };

      if (feasibilityStudy) {
        // 수정
        const response = await apiClient.put(
          API_ENDPOINTS.FEASIBILITY_STUDIES.UPDATE(feasibilityStudy.id),
          submitData
        );

        if (response.error) {
          console.error("Error updating feasibility study:", response.error);
          return;
        }
      } else {
        // 생성
        const response = await apiClient.post(
          API_ENDPOINTS.FEASIBILITY_STUDIES.CREATE,
          submitData
        );

        if (response.error) {
          console.error("Error creating feasibility study:", response.error);
          return;
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: "검토 대기",
      in_review: "검토 중",
      approved: "승인",
      rejected: "반려",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      in_review: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            타당성 검토 의뢰서
          </DialogTitle>
          <DialogDescription>
            {customerName}의 한전수전합리화 사업 타당성 검토 의뢰서를
            관리합니다.
          </DialogDescription>
        </DialogHeader>

        {feasibilityStudy && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">현재 상태</CardTitle>
                <Badge className={getStatusColor(feasibilityStudy.status)}>
                  {getStatusText(feasibilityStudy.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">신청일</p>
                  <p>
                    {new Date(
                      feasibilityStudy.request_date
                    ).toLocaleDateString()}
                  </p>
                </div>
                {feasibilityStudy.target_completion_date && (
                  <div>
                    <p className="font-medium text-gray-500">목표 완료일</p>
                    <p>
                      {new Date(
                        feasibilityStudy.target_completion_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {feasibilityStudy.expected_cost_reduction && (
                  <div>
                    <p className="font-medium text-gray-500">예상 절감액</p>
                    <p>
                      {new Intl.NumberFormat("ko-KR").format(
                        feasibilityStudy.expected_cost_reduction
                      )}
                      원
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Form form={form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="request_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      신청일 *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      목표 완료일
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expected_cost_reduction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    예상 절감액 (원)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="연간 예상 절감액을 입력하세요"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업 개요</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="한전수전합리화 사업의 개요를 입력하세요"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>검토 상태 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">검토 대기</SelectItem>
                      <SelectItem value="in_review">검토 중</SelectItem>
                      <SelectItem value="approved">승인</SelectItem>
                      <SelectItem value="rejected">반려</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="review_comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>검토 의견</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="검토 의견이나 특이사항을 입력하세요"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "저장 중..." : feasibilityStudy ? "수정" : "등록"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
