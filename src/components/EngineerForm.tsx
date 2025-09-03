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
import { Textarea } from "@/components/ui/Textarea";
import { formatPhoneNumber, formatUserId, validateUserId } from "@/lib/utils";
import { Engineer, EngineerRequest } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const engineerSchema = z.object({
  username: z
    .string()
    .min(1, "아이디를 입력해주세요")
    .min(3, "아이디는 3자 이상이어야 합니다")
    .max(20, "아이디는 20자 이하여야 합니다")
    .refine(
      validateUserId,
      "아이디는 영문 소문자, 숫자, 특수문자(_-.)만 사용 가능합니다"
    ),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().min(1, "연락처를 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  address: z.string().min(1, "주소를 입력해주세요"),
});

type EngineerFormData = z.infer<typeof engineerSchema>;

interface EngineerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engineer: Engineer | null;
  onSubmit: (data: EngineerRequest) => void;
}

export function EngineerForm({
  open,
  onOpenChange,
  engineer,
  onSubmit,
}: EngineerFormProps) {
  const [showUserIdWarning, setShowUserIdWarning] = useState(false);

  const form = useForm<EngineerFormData>({
    resolver: zodResolver(engineerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (engineer) {
      form.reset({
        username: engineer.userId || "",
        password: engineer.userPw || "",
        name: engineer.name || "",
        phone: engineer.phoneNumber || "",
        email: engineer.email || "",
        address: engineer.address || "",
      });
    } else {
      form.reset({
        username: "",
        password: "",
        name: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [engineer, form]);

  const handleSubmit = (data: EngineerFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{engineer ? "기술사 수정" : "기술사 추가"}</DialogTitle>
          <DialogDescription>기술사 정보를 입력해주세요.</DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이디 *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="영문 소문자, 숫자, 특수문자(_-.)만 입력 가능"
                      value={formatUserId(field.value)}
                      onInput={(e) => {
                        const originalValue = e.currentTarget.value;
                        const formattedValue = formatUserId(originalValue);

                        // 허용되지 않는 문자가 입력된 경우 경고 표시
                        if (originalValue !== formattedValue) {
                          setShowUserIdWarning(true);
                          // 3초 후 경고 숨기기
                          setTimeout(() => setShowUserIdWarning(false), 3000);
                        }
                      }}
                      onChange={(e) =>
                        field.onChange(formatUserId(e.target.value))
                      }
                    />
                  </FormControl>
                  {showUserIdWarning && (
                    <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 mt-1">
                      ⚠️ 영문 소문자, 숫자, 특수문자(_-.)만 입력 가능합니다.
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 *</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input
                      {...field}
                      placeholder="숫자만 입력 가능합니다."
                      value={field.value ? formatPhoneNumber(field.value) : ""}
                      onChange={(e) =>
                        field.onChange(formatPhoneNumber(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">{engineer ? "수정" : "추가"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
