import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal, Select } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import type {
  UpdateUserInput,
  UserInput,
  UserListItem,
  UserRoleCode,
} from "@/types/user-management";
import { isItManagedUserRole, USER_ROLE_OPTIONS } from "./userRoleOptions";

const schema = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc").max(200),
  email: z.string().trim().min(1, "Email là bắt buộc").email("Email không hợp lệ").max(255),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || /^[0-9+().\s-]{6,20}$/.test(value), "Số điện thoại không hợp lệ"),
  roleCode: z.enum(["SA", "TPKH", "NVKH", "RD", "ACCOUNTING", "IT"]),
});

type FormValues = z.infer<typeof schema>;

const itRoles = USER_ROLE_OPTIONS.filter((role) => isItManagedUserRole(role.value));
type UserFormProps = {
  mode: "create" | "edit";
  user?: UserListItem;
  actorRole: string;
  actorId: string;
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: UserInput | UpdateUserInput) => void;
};

export function UserForm({
  mode,
  user,
  actorRole,
  actorId,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: UserFormProps) {
  const isSelf = user?.id === actorId;
  const roles =
    isSelf && user?.role
      ? [{ value: user.role.code, label: user.role.name }]
      : actorRole === "SA"
        ? USER_ROLE_OPTIONS
        : itRoles;
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: user
      ? {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone ?? "",
          roleCode: user.role?.code ?? ("NVKH" as UserRoleCode),
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          roleCode: (actorRole === "SA" ? "NVKH" : "TPKH") as UserRoleCode,
        },
  });
  const close = () => {
    if (!formState.isDirty || window.confirm("Bạn có muốn hủy các thay đổi chưa lưu không?")) {
      onClose();
    }
  };

  return (
    <Modal
      open
      title={mode === "create" ? "Tạo người dùng" : "Chỉnh sửa người dùng"}
      closeLabel="Đóng biểu mẫu người dùng"
      onClose={close}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button form="user-form" type="submit" loading={isSubmitting}>
            {mode === "create" ? "Tạo người dùng" : "Lưu thay đổi"}
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit((values) => {
          const normalized = {
            fullName: values.fullName,
            email: values.email.toLowerCase(),
            phone: values.phone || null,
            roleCode: values.roleCode,
          };
          onSubmit(mode === "create" ? { ...normalized, accountStatus: "active" } : normalized);
        })}
        noValidate
      >
        {serverError && (
          <div className="sm:col-span-2">
            <Alert variant="error" title="Không thể lưu người dùng">
              {serverError.message}
            </Alert>
          </div>
        )}
        {isSelf && (
          <div className="sm:col-span-2">
            <Alert variant="info" title="Tài khoản đang đăng nhập">
              Bạn có thể sửa thông tin cá nhân nhưng không thể tự đổi vai trò.
            </Alert>
          </div>
        )}
        <Input
          label="Họ và tên"
          error={formState.errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={formState.errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Số điện thoại"
          autoComplete="tel"
          error={formState.errors.phone?.message}
          {...register("phone")}
        />
        <Select
          label="Vai trò"
          options={roles}
          error={formState.errors.roleCode?.message}
          disabled={isSelf || isSubmitting}
          {...register("roleCode")}
        />
      </form>
    </Modal>
  );
}
