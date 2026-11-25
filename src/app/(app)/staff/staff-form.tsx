"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Briefcase, Landmark, PhoneCall, Save, UserRound, UsersRound, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createStaff, updateStaff } from "./actions"
import {
  BANK_ACCOUNT_TYPES,
  BANK_NAMES,
  STAFF_DEPARTMENTS,
  STAFF_POSITIONS,
  STAFF_STATUSES,
  staffSchema,
  type StaffInput,
} from "./schema"

type Props = {
  /** มี staffId = แก้ไข, ไม่มี = เพิ่มใหม่ */
  staffId?: number
  defaultValues: StaffInput
}

/** ฟอร์มเดียวใช้ทั้งเพิ่มและแก้ไข (แบ่ง 4 การ์ด: ข้อมูลส่วนตัว + การทำงาน + ธนาคาร + ผู้ติดต่อฉุกเฉิน) */
export function StaffForm({ staffId, defaultValues }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<StaffInput>({ resolver: zodResolver(staffSchema), defaultValues })

  function onSubmit(values: StaffInput) {
    startTransition(async () => {
      const result = staffId ? await updateStaff(staffId, values) : await createStaff(values)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof StaffInput, { message: messages[0] })
        }
        return
      }
      toast.success(result.message)
      router.push("/staff")
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* การ์ดที่ 1: ข้อมูลส่วนตัวพนักงาน */}
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
          <UserRound className="size-5 shrink-0" />
          <h2 className="font-semibold">ข้อมูลส่วนตัวพนักงาน</h2>
        </div>

        <CardContent className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            {/* กรอบรูปพนักงานด้านซ้าย (รอ module อัปโหลดไฟล์ขั้น 2 ของ Tech Lead) */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center">
              <div className="flex size-24 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <UsersRound className="size-10" />
              </div>
              <span className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                รูปพนักงาน / ลายเซ็น
              </span>
              <p className="mt-1.5 text-[11px] text-muted-foreground">รองรับอัปโหลดในขั้นถัดไป</p>
            </div>

            {/* ฟิลด์ข้อมูลหลักด้านขวา */}
            <FieldGroup className="grid gap-5 md:grid-cols-2">
              <TextField form={form} name="code" label="รหัสพนักงาน" placeholder="เช่น EMP001" />
              <TextField form={form} name="name" label="ชื่อพนักงาน" required placeholder="ระบุชื่อ-นามสกุล" />
              <SelectField form={form} name="position" label="ตำแหน่งงาน" options={STAFF_POSITIONS} placeholder="เลือกตำแหน่งงาน" />
              <SelectField
                form={form}
                name="department"
                label="ประจำหน่วยงาน"
                options={STAFF_DEPARTMENTS}
                placeholder="เลือกหน่วยงาน"
              />
            </FieldGroup>
          </div>
          {/* TODO (Tech Lead, ขั้น 2): อัปโหลดรูปพนักงานและลายเซ็น หลังทำ module เก็บไฟล์ */}
        </CardContent>
      </Card>

      {/* ส่วนล่างแบ่ง 2 คอลัมน์: ซ้าย = ข้อมูลการทำงาน / ขวา = ข้อมูลธนาคาร + ผู้ติดต่อฉุกเฉิน */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* การ์ดที่ 2: ข้อมูลการทำงาน */}
        <Card className="overflow-hidden pt-0">
          <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
            <Briefcase className="size-5 shrink-0" />
            <h2 className="font-semibold">ข้อมูลการทำงาน</h2>
          </div>
          <CardContent className="pt-6">
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <TextField
                form={form}
                name="nationalId"
                label="หมายเลขบัตรประชาชน"
                description="ตัวเลข 13 หลัก"
                inputMode="numeric"
              />
              <SelectField form={form} name="status" label="สถานะการทำงาน" options={STAFF_STATUSES} placeholder="เลือกสถานะ" />
              <Controller
                control={form.control}
                name="address"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                    <FieldLabel htmlFor="address">ที่อยู่ (ติดต่อได้)</FieldLabel>
                    <Textarea id="address" rows={3} aria-invalid={fieldState.invalid} {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <TextField form={form} name="phone" label="หมายเลขโทรศัพท์" inputMode="tel" />
              <TextField form={form} name="email" label="อีเมล" type="email" />
              <TextField form={form} name="startDate" label="วันที่เข้างาน" type="date" />
              <TextField form={form} name="endDate" label="วันที่ลาออก" type="date" />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* คอลัมน์ขวา: ข้อมูลธนาคาร + ผู้ติดต่อฉุกเฉิน */}
        <div className="space-y-6">
          {/* การ์ดที่ 3: ข้อมูลธนาคาร */}
          <Card className="overflow-hidden pt-0">
            <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
              <Landmark className="size-5 shrink-0" />
              <h2 className="font-semibold">ข้อมูลธนาคาร</h2>
            </div>
            <CardContent className="pt-6">
              <FieldGroup className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <SelectField form={form} name="bankName" label="บัญชีธนาคาร" options={BANK_NAMES} placeholder="เลือกธนาคาร" />
                </div>
                <SelectField
                  form={form}
                  name="bankAccountType"
                  label="ประเภทบัญชีธนาคาร"
                  options={BANK_ACCOUNT_TYPES}
                  placeholder="เลือกประเภทบัญชี"
                />
                <TextField form={form} name="bankAccountNo" label="เลขบัญชีธนาคาร" inputMode="numeric" />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* การ์ดที่ 4: ผู้ติดต่อฉุกเฉิน */}
          <Card className="overflow-hidden pt-0">
            <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
              <PhoneCall className="size-5 shrink-0" />
              <h2 className="font-semibold">ผู้ติดต่อฉุกเฉิน</h2>
            </div>
            <CardContent className="pt-6">
              <FieldGroup className="grid gap-5 sm:grid-cols-2">
                <TextField form={form} name="emergencyContact" label="กรณีฉุกเฉินติดต่อ" />
                <TextField form={form} name="contactPhone" label="โทรศัพท์ฉุกเฉิน" inputMode="tel" />
                <div className="sm:col-span-2">
                  <TextField form={form} name="workplace" label="สถานที่ทำงาน" />
                </div>
                <Controller
                  control={form.control}
                  name="note"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                      <FieldLabel htmlFor="note">หมายเหตุ</FieldLabel>
                      <Textarea id="note" rows={2} aria-invalid={fieldState.invalid} {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* แถบปุ่มดำเนินการด้านล่าง */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button type="submit" disabled={pending} className="min-w-32 gap-2">
          <Save className="size-4" />
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href="/staff"
          className={buttonVariants({
            className: "min-w-32 gap-2 !bg-destructive text-primary-foreground hover:!bg-destructive/90",
          })}
        >
          <X className="size-4" />
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}

/** ช่องกรอกข้อความ 1 ช่อง */
function TextField({
  form,
  name,
  label,
  description,
  required,
  ...inputProps
}: {
  form: ReturnType<typeof useForm<StaffInput>>
  name: keyof StaffInput
  label: string
  description?: string
  required?: boolean
} & Omit<React.ComponentProps<typeof Input>, "form" | "name">) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>
            {label}
            {required && <span className="text-destructive">*</span>}
          </FieldLabel>
          <Input id={name} aria-invalid={fieldState.invalid} {...inputProps} {...field} />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/** ช่องเลือก dropdown 1 ช่อง */
function SelectField({
  form,
  name,
  label,
  options,
  placeholder,
  required,
}: {
  form: ReturnType<typeof useForm<StaffInput>>
  name: keyof StaffInput
  label: string
  options: readonly string[]
  placeholder?: string
  required?: boolean
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>
            {label}
            {required && <span className="text-destructive">*</span>}
          </FieldLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}