"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Phone, Plus, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createCompany, updateCompany } from "./actions"
import { companySchema, type CompanyInput } from "./schema"

type Props = {
  /** มี companyId = แก้ไข, ไม่มี = เพิ่มใหม่ */
  companyId?: number
  defaultValues: CompanyInput
}

/** ฟอร์มเดียวใช้ทั้งเพิ่มและแก้ไข (แบ่ง 2 การ์ด: ข้อมูลบริษัทหลัก + ที่อยู่และการติดต่อ) */
export function CompanyForm({ companyId, defaultValues }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<CompanyInput>({ resolver: zodResolver(companySchema), defaultValues })

  function onSubmit(values: CompanyInput) {
    startTransition(async () => {
      const result = companyId ? await updateCompany(companyId, values) : await createCompany(values)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof CompanyInput, { message: messages[0] })
        }
        return
      }
      toast.success(result.message)
      router.push("/companies")
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* การ์ดที่ 1: ข้อมูลบริษัทหลัก */}
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
          <Building2 className="size-5 shrink-0" />
          <h2 className="font-semibold">ข้อมูลบริษัทหลัก</h2>
        </div>
        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="company-id-display">ID Company</FieldLabel>
              <Input
                id="company-id-display"
                value={companyId ? `COMP${String(companyId).padStart(3, "0")}` : "สร้างอัตโนมัติเมื่อบันทึก"}
                disabled
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </Field>
            <TextField form={form} name="code" label="รหัสบริษัท" required />
            <TextField form={form} name="nameTh" label="ชื่อบริษัท TH" required />
            <TextField form={form} name="nameEn" label="ชื่อบริษัท ENG" />
          </FieldGroup>
          {/* TODO (Tech Lead, ขั้น 2): อัปโหลดรูปหัว/ท้ายกระดาษ หลังทำ module เก็บไฟล์ */}
        </CardContent>
      </Card>

      {/* การ์ดที่ 2: ที่อยู่และการติดต่อ */}
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
          <Phone className="size-5 shrink-0" />
          <h2 className="font-semibold">ที่อยู่และการติดต่อ</h2>
        </div>
        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <TextField
              form={form}
              name="taxId"
              label="เลขประจำตัวผู้เสียภาษี"
              description="ตัวเลข 13 หลัก"
              inputMode="numeric"
            />
            <TextField form={form} name="phone" label="โทรศัพท์" inputMode="tel" />
            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                  <FieldLabel htmlFor="address">ที่อยู่</FieldLabel>
                  <Textarea id="address" rows={3} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <TextField form={form} name="fax" label="โทรสาร" inputMode="tel" />
            <TextField form={form} name="email" label="อีเมล" type="email" />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* แถบปุ่มดำเนินการด้านล่าง */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button type="submit" disabled={pending} className="min-w-32 gap-2">
          <Save className="size-4" />
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link href="/companies" className={buttonVariants({ variant: "outline", className: "min-w-32 gap-2" })}>
          <Plus className="size-4" />
          ยกเลิก / กลับหน้ารายการ
        </Link>
      </div>
    </form>
  )
}

/** ช่องกรอกข้อความ 1 ช่อง (label + input + ข้อความ error) */
function TextField({
  form,
  name,
  label,
  description,
  required,
  ...inputProps
}: {
  form: ReturnType<typeof useForm<CompanyInput>>
  name: keyof CompanyInput
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