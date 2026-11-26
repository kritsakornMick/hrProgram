"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Briefcase, ClipboardCheck, FileCheck2, Save, UserCheck, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createInterview, updateInterview } from "./actions"
import {
  bankOptions,
  employmentStatusOptions,
  evaluationResultOptions,
  interviewResultOptions,
  interviewSchema,
  type InterviewInput,
} from "./schema"

export type DocumentCheckOption = {
  id: number
  applicantName: string
  appliedAt: string
  appliedPosition: string
  expectedSalary: string
}

export type CompanyOption = {
  id: number
  nameTh: string
}

export type CustomerOption = {
  id: number
  name: string
  jobName: string | null
  companyId: number | null
}

export type StaffOption = {
  id: number
  name: string
  position: string | null
}

type Props = {
  interviewId?: number
  documentChecks: DocumentCheckOption[]
  companies: CompanyOption[]
  customers: CustomerOption[]
  staffList: StaffOption[]
  defaultValues: InterviewInput
}

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function InterviewForm({
  interviewId,
  documentChecks,
  companies,
  customers,
  staffList,
  defaultValues,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const form = useForm<InterviewInput>({
    resolver: zodResolver(interviewSchema),
    defaultValues,
  })

  const selectedDocId = useWatch({ control: form.control, name: "documentCheckId" })
  const selectedCompanyId = useWatch({ control: form.control, name: "companyFilterId" })
  const selectedStaffId = useWatch({ control: form.control, name: "staffId" })
  const probationStart = useWatch({ control: form.control, name: "probationStartDate" })
  const probationDays = useWatch({ control: form.control, name: "probationDays" })

  const selectedDoc = documentChecks.find((d) => String(d.id) === selectedDocId)
  const selectedStaff = staffList.find((s) => String(s.id) === selectedStaffId)

  const filteredCustomers = selectedCompanyId
    ? customers.filter((c) => String(c.companyId) === selectedCompanyId)
    : customers

  // ดึงตำแหน่งที่สมัครมาเป็นค่าเริ่มต้นของตำแหน่งบรรจุงานอัตโนมัติ (เมื่อสร้างใหม่)
  useEffect(() => {
    if (!interviewId && selectedDoc?.appliedPosition && !form.getValues("position")) {
      form.setValue("position", selectedDoc.appliedPosition)
    }
  }, [interviewId, selectedDoc, form])

  // คำนวณวันที่จบทดลองงานอัตโนมัติจากวันที่เริ่มทดลองงาน + จำนวนวันทดลองงาน
  useEffect(() => {
    if (!probationStart || !probationDays) return
    const days = Number(probationDays)
    if (!Number.isFinite(days) || days <= 0) return
    const start = new Date(probationStart)
    if (Number.isNaN(start.getTime())) return
    start.setDate(start.getDate() + days)
    form.setValue("probationEndDate", start.toISOString().slice(0, 10))
  }, [probationStart, probationDays, form])

  function onSubmit(values: InterviewInput) {
    startTransition(async () => {
      const result = interviewId ? await updateInterview(interviewId, values) : await createInterview(values)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof InterviewInput, { message: messages[0] })
        }
        return
      }
      toast.success(result.message)
      router.push("/interviews")
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* การ์ดที่ 1: ข้อมูลผู้สมัครงาน (ดึงจากใบตรวจเอกสารสมัครงาน) */}
      <Card className="overflow-hidden pt-0">
        <CardHeader className="bg-primary py-3.5 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="size-4" />
            ข้อมูลผู้สมัครงาน
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-12">
            <Field className="md:col-span-3">
              <FieldLabel htmlFor="interviewCode">ID สัมภาษณ์</FieldLabel>
              <Input
                id="interviewCode"
                value={interviewId ? `INT${String(interviewId).padStart(3, "0")}` : "(สร้างอัตโนมัติ)"}
                disabled
                className="bg-muted"
              />
            </Field>

            <Controller
              control={form.control}
              name="documentCheckId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-6">
                  <FieldLabel htmlFor="documentCheckId">
                    ID ตรวจเอกสารสมัครงาน / ผู้สมัคร <span className="text-destructive">*</span>
                  </FieldLabel>
                  <select id="documentCheckId" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกผู้สมัครงานที่ตรวจเอกสารแล้ว --</option>
                    {documentChecks.map((doc) => (
                      <option key={doc.id} value={String(doc.id)}>
                        DOC{String(doc.id).padStart(3, "0")} - {doc.applicantName} ({doc.appliedPosition || "ไม่ระบุตำแหน่ง"})
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Field className="md:col-span-3">
              <FieldLabel htmlFor="appliedAt">วันที่สมัครงาน</FieldLabel>
              <Input id="appliedAt" value={selectedDoc?.appliedAt || "-"} disabled className="bg-muted" />
            </Field>

            <Field className="md:col-span-4">
              <FieldLabel htmlFor="applicantName">คำนำหน้า-ชื่อ-สกุล (ไทย)</FieldLabel>
              <Input id="applicantName" value={selectedDoc?.applicantName || "-"} disabled className="bg-muted" />
            </Field>

            <Field className="md:col-span-4">
              <FieldLabel htmlFor="appliedPosition">ตำแหน่งงานที่สมัคร</FieldLabel>
              <Input id="appliedPosition" value={selectedDoc?.appliedPosition || "-"} disabled className="bg-muted" />
            </Field>

            <Field className="md:col-span-4">
              <FieldLabel htmlFor="expectedSalary">เงินเดือนที่ต้องการ (บาท)</FieldLabel>
              <Input
                id="expectedSalary"
                value={selectedDoc?.expectedSalary || "-"}
                disabled
                className="bg-muted text-right"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* การ์ดที่ 2: ผลการสัมภาษณ์และอัตราค่าจ้าง */}
      <Card className="overflow-hidden pt-0">
        <CardHeader className="bg-primary py-3.5 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="size-4" />
            ผลการสัมภาษณ์และค่าจ้าง
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-12">
            <TextField form={form} name="interviewedAt" label="วันที่สัมภาษณ์" type="date" className="md:col-span-3" />

            <Controller
              control={form.control}
              name="result"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-3">
                  <FieldLabel htmlFor="result">ผลการสัมภาษณ์</FieldLabel>
                  <select id="result" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกผลการสัมภาษณ์ --</option>
                    {interviewResultOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="employmentStatus"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-3">
                  <FieldLabel htmlFor="employmentStatus">สถานะการจ้างงาน</FieldLabel>
                  <select id="employmentStatus" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกสถานะ --</option>
                    {employmentStatusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <TextField
              form={form}
              name="wageRate"
              label="อัตราค่าจ้าง (บาท)"
              type="number"
              step="0.01"
              className="text-right md:col-span-3"
            />

            <Controller
              control={form.control}
              name="resultReason"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-12">
                  <FieldLabel htmlFor="resultReason">สาเหตุเพราะ</FieldLabel>
                  <Textarea id="resultReason" rows={2} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* การ์ดที่ 3: สังกัด การบรรจุงาน และผู้สัมภาษณ์ */}
      <Card className="overflow-hidden pt-0">
        <CardHeader className="bg-primary py-3.5 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4" />
            สังกัด การบรรจุงาน และผู้สัมภาษณ์
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-12">
            <Controller
              control={form.control}
              name="companyFilterId"
              render={({ field }) => (
                <Field className="md:col-span-6">
                  <FieldLabel htmlFor="companyFilterId">สังกัดบริษัท (ตัวกรองหน่วยงาน)</FieldLabel>
                  <select
                    id="companyFilterId"
                    className={selectClassName}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      form.setValue("customerId", "")
                    }}
                  >
                    <option value="">-- แสดงทุกบริษัทในเครือ --</option>
                    {companies.map((company) => (
                      <option key={company.id} value={String(company.id)}>
                        {company.nameTh}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="customerId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-6">
                  <FieldLabel htmlFor="customerId">ภายใต้บริษัท / หน่วยงานลูกค้า</FieldLabel>
                  <select id="customerId" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกหน่วยงานลูกค้า --</option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer.id} value={String(customer.id)}>
                        {customer.name}
                        {customer.jobName ? ` (${customer.jobName})` : ""}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <TextField form={form} name="startDate" label="วันที่เริ่มงาน" type="date" className="md:col-span-3" />
            <TextField form={form} name="position" label="ตำแหน่งที่บรรจุ" className="md:col-span-4" />
            <TextField
              form={form}
              name="probationDays"
              label="ทดลองงาน (วัน)"
              type="number"
              placeholder="เช่น 90 หรือ 119"
              className="md:col-span-2"
            />
            <TextField
              form={form}
              name="probationStartDate"
              label="วันที่เริ่มทดลองงาน"
              type="date"
              className="md:col-span-3"
            />

            <TextField
              form={form}
              name="probationEndDate"
              label="วันที่จบทดลองงาน"
              type="date"
              className="md:col-span-3"
            />

            <Controller
              control={form.control}
              name="staffId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-5">
                  <FieldLabel htmlFor="staffId">ผู้สัมภาษณ์</FieldLabel>
                  <select id="staffId" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกพนักงานผู้สัมภาษณ์ --</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={String(staff.id)}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Field className="md:col-span-4">
              <FieldLabel htmlFor="interviewerPosition">ตำแหน่งผู้สัมภาษณ์</FieldLabel>
              <Input
                id="interviewerPosition"
                value={selectedStaff?.position || "-"}
                disabled
                className="bg-muted"
              />
            </Field>

            <Controller
              control={form.control}
              name="comment"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-12">
                  <FieldLabel htmlFor="comment">ความคิดเห็น</FieldLabel>
                  <Textarea id="comment" rows={2} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* การ์ดที่ 4: การประเมินผู้สมัครงาน */}
      <Card className="overflow-hidden pt-0">
        <CardHeader className="bg-primary py-3.5 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck2 className="size-4" />
            การประเมินผู้สมัครงาน
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-12">
            <TextField
              form={form}
              name="evaluatedAt"
              label="วันที่ทำการประเมิน"
              type="date"
              className="md:col-span-3"
            />

            <Controller
              control={form.control}
              name="evaluationResult"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-3">
                  <FieldLabel htmlFor="evaluationResult">ผลการประเมิน</FieldLabel>
                  <select id="evaluationResult" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกผลการประเมิน --</option>
                    {evaluationResultOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="bankName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-3">
                  <FieldLabel htmlFor="bankName">บัญชีธนาคาร</FieldLabel>
                  <select id="bankName" aria-invalid={fieldState.invalid} className={selectClassName} {...field}>
                    <option value="">-- เลือกธนาคาร --</option>
                    {bankOptions.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <TextField form={form} name="bankAccountNo" label="เลขบัญชีธนาคาร" className="md:col-span-3" />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ปุ่มบันทึกข้อมูล */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <Button type="submit" disabled={pending} size="lg" className="min-w-36 rounded-xl">
          <Save />
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href="/interviews"
          className={buttonVariants({
            variant: "ghost",
            size: "lg",
            className: "min-w-36 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90",
          })}
        >
          <X />
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}

function TextField({
  form,
  name,
  label,
  required,
  className,
  ...inputProps
}: {
  form: ReturnType<typeof useForm<InterviewInput>>
  name: keyof InterviewInput
  label: string
  required?: boolean
} & Omit<React.ComponentProps<typeof Input>, "form" | "name">) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>
            {label}
            {required && <span className="text-destructive">*</span>}
          </FieldLabel>
          <Input id={name} aria-invalid={fieldState.invalid} {...inputProps} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}