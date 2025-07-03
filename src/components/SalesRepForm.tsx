import { Button } from "@/components/ui/Button";
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
import { SalesRep } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const salesRepSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().min(1, "연락처를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  commission_rate: z.number().min(0).max(100),
  address: z.string().min(1, "주소를 입력해주세요"),
  settlement_method: z.enum(["invoice", "withholding"]),
  bank_name: z.string().min(1, "은행명을 입력해주세요"),
  account_number: z.string().min(1, "계좌번호를 입력해주세요"),
  business_number: z.string().optional(),
  business_type: z.string().optional(),
  business_category: z.string().optional(),
  representative: z.string().optional(),
  business_address: z.string().optional(),
});

type SalesRepFormData = z.infer<typeof salesRepSchema>;

interface SalesRepFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesRep: SalesRep | null;
  onSubmit: (data: Omit<SalesRep, "id" | "created_at" | "updated_at">) => void;
}

export function SalesRepForm({
  open,
  onOpenChange,
  salesRep,
  onSubmit,
}: SalesRepFormProps) {
  const form = useForm<SalesRepFormData>({
    resolver: zodResolver(salesRepSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      commission_rate: 0,
      address: "",
      settlement_method: "invoice",
      bank_name: "",
      account_number: "",
      business_number: "",
      business_type: "",
      business_category: "",
      representative: "",
      business_address: "",
    },
  });

  useEffect(() => {
    if (salesRep) {
      form.reset({
        name: salesRep.name,
        phone: salesRep.phone,
        email: salesRep.email,
        commission_rate: salesRep.commission_rate,
        address: salesRep.address,
        settlement_method: salesRep.settlement_method,
        bank_name: salesRep.bank_name,
        account_number: salesRep.account_number,
        business_number: salesRep.business_number || "",
        business_type: salesRep.business_type || "",
        business_category: salesRep.business_category || "",
        representative: salesRep.representative || "",
        business_address: salesRep.business_address || "",
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        email: "",
        commission_rate: 0,
        address: "",
        settlement_method: "invoice",
        bank_name: "",
        account_number: "",
        business_number: "",
        business_type: "",
        business_category: "",
        representative: "",
        business_address: "",
      });
    }
  }, [salesRep, form]);

  const handleSubmit = (data: SalesRepFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{salesRep ? "영업자 수정" : "영업자 추가"}</DialogTitle>
          <DialogDescription>
            영업자 정보를 입력해주세요. *는 필수 입력 항목입니다.
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">기본 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>연락처 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="010-1234-5678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 수수료 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">수수료 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수수료율 (%) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settlement_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>정산방법 *</FormLabel>
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
                          <SelectItem value="invoice">계산서</SelectItem>
                          <SelectItem value="withholding">원천징수</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>은행명 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>계좌번호 *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 사업자 정보 (선택사항) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">사업자 정보 (선택사항)</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="business_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사업자등록번호</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123-45-67890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="representative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>대표자</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="business_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>업종</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>업태</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="business_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사업장 주소</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">{salesRep ? "수정" : "추가"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
