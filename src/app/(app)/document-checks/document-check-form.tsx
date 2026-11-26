"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, FileCheck2, Paperclip, Save, UserCheck, UserRound, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createDocumentCheck, updateDocumentCheck } from "./actions"
import { CAR_LICENSE_TYPES, documentCheckSchema, type DocumentCheckInput } from "./schema"

export type ApplicantOption = {
  id: number
  fullNameTh: string
  position: string | null
  appliedAtLabel: string
}

export type StaffOption = {
  id: number
  code: string | null
  name: string
  position: string | null
}

type Props = {
  /** มี documentCheckId = แก้ไข, ไม่มี = เพิ่มใหม่ */
  documentCheckId?: number
  defaultValues: DocumentCheckInput
  applicants: ApplicantOption[]
  staffList: StaffOption[]
}

const CHECKLIST_ITEMS = [
  { no: 1, name: "hasPhoto", label: "รูปถ่าย", attachmentLabel: "แนบรูปถ่าย" },
  { no: 2, name: "hasIdCard", label: "บัตร ปชช", attachmentLabel: "แนบสำเนาบัตร" },
  { no: 3, name: "hasHouseRegistration", label: "ทะเบียนบ้าน", attachmentLabel: "แนบทะเบียนบ้าน" },
  { no: 4, name: "hasEducationCert", label: "วุฒิการศึกษา", attachmentLabel: "แนบสำเนาวุฒิ" },
  { no: 5, name: "hasCarLicense", label: "ใบขับขี่รถยนต์", attachmentLabel: "แนบใบขับขี่รถยนต์" },
  { no: 6, name: "hasMotorcycleLicense", label: "ใบขับขี่มอเตอร์ไซต์", attachmentLabel: "แนบใบขับขี่มอเตอร์ไซต์" },
  { no: 7, name: "hasDisabilityCard", label: "บัตรคนพิการ", attachmentLabel: "แนบบัตรคนพิการ" },
  { no: 8, name: "hasMilitaryDoc", label: "บัตรผ่านเกณฑ์ทหาร", attachmentLabel: "แนบเอกสารทหาร" },
  { no: 9, name: "hasOther", label: "อื่นๆ", attachmentLabel: "เอกสารเพิ่มเติม" },
] as const

export function DocumentCheckForm({ documentCheckId, defaultValues, applicants, staffList }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<DocumentCheckInput>({
    resolver: zodResolver(documentCheckSchema),
    defaultValues,
  })

  const selectedApplicantId = useWatch({ control: form.control, name: "applicantId" })
  const selectedStaffId = useWatch({ control: form.control, name: "checkedById" })
  const hasCarLicense = useWatch({ control: form.control, name: "hasCarLicense" })

  const selectedApplicant = applicants.find((a) => String(a.id) === selectedApplicantId)
  const selectedStaff = staffList.find((s) => String(s.id) === selectedStaffId)

  function onSubmit(values: DocumentCheckInput) {
    startTransition(async () => {
      const result = documentCheckId
        ? await updateDocumentCheck(documentCheckId, values)
        : await createDocumentCheck(values)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof DocumentCheckInput, { message: messages[0] })
        }
        return
      }
      toast.success(result.message)
      router.push("/document-checks")
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* การ์ดที่ 1: ข้อมูลแบบตรวจและผู้สมัครงาน */}
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
          <UserRound className="size-5 shrink-0" />
          <h2 className="font-semibold">ข้อมูลแบบตรวจและผู้สมัครงาน</h2>
        </div>
        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="checkNo">เลขที่แบบตรวจ</FieldLabel>
              <Input
                id="checkNo"
                value={documentCheckId ? `DC-${String(documentCheckId).padStart(4, "0")}` : "(สร้างอัตโนมัติ)"}
                readOnly
                disabled
              />
            </Field>

            <Controller
              control={form.control}
              name="checkedAt"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="checkedAt">
                    วันที่ตรวจเอกสาร<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input id="checkedAt" type="date" aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="applicantId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="applicantId">
                    เลขที่ผู้สมัคร / ชื่อผู้สมัคร<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger id="applicantId" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="เลือกผู้สมัครงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicants.map((applicant) => (
                        <SelectItem key={applicant.id} value={String(applicant.id)}>
                          #{applicant.id} — {applicant.fullNameTh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="applicantNameDisplay">คำนำหน้า-ชื่อ-สกุล (ไทย)</FieldLabel>
              <Input
                id="applicantNameDisplay"
                value={selectedApplicant?.fullNameTh ?? "-"}
                readOnly
                disabled
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="appliedAtDisplay">วันที่สมัคร</FieldLabel>
              <Input
                id="appliedAtDisplay"
                value={selectedApplicant?.appliedAtLabel ?? "-"}
                readOnly
                disabled
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="positionDisplay">ตำแหน่งงาน</FieldLabel>
              <Input
                id="positionDisplay"
                value={selectedApplicant?.position ?? "-"}
                readOnly
                disabled
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* การ์ดที่ 2: รายการตรวจสอบเอกสารประกอบการสมัครงาน */}
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
          <FileCheck2 className="size-5 shrink-0" />
          <h2 className="font-semibold">รายการตรวจสอบเอกสารประกอบการสมัครงาน</h2>
        </div>
        <CardContent className="space-y-4 pt-6">
          <div className="divide-y divide-border rounded-lg border border-border">
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {item.no}
                  </span>
                  <Controller
                    control={form.control}
                    name={item.name}
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center gap-2.5 select-none">
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                        />
                        <span className="font-medium">{item.label}</span>
                      </label>
                    )}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pl-9 sm:pl-0">
                  {item.name === "hasCarLicense" && (
                    <Controller
                      control={form.control}
                      name="carLicenseType"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="w-full sm:w-56">
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            disabled={!hasCarLicense}
                          >
                            <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                              <SelectValue placeholder="เลือกชนิดใบขับขี่" />
                            </SelectTrigger>
                            <SelectContent>
                              {CAR_LICENSE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  )}

                  {/* TODO (Tech Lead, ขั้น 2): อัปโหลดไฟล์แนบ 8 ช่อง (DocumentAttachment) หลังทำ module เก็บไฟล์ */}
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                    <Paperclip className="size-3.5" />
                    {item.attachmentLabel} (รองรับในขั้นถัดไป)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Controller
            control={form.control}
            name="comment"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="comment">รายละเอียดเพิ่มเติม / ความคิดเห็น</FieldLabel>
                <Textarea
                  id="comment"
                  rows={3}
                  placeholder="ระบุรายละเอียดเอกสารอื่นๆ หรือหมายเหตุการตรวจเอกสาร..."
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldDescription>หากเลือกข้อ 9 (อื่นๆ) กรุณาระบุรายละเอียดเอกสารในช่องนี้</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </CardContent>
      </Card>

      {/* การ์ดที่ 3: ผลการตรวจและเจ้าหน้าที่ผู้ตรวจ */}
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center gap-2.5 bg-primary px-6 py-3.5 text-primary-foreground">
          <UserCheck className="size-5 shrink-0" />
          <h2 className="font-semibold">สรุปผลการตรวจและผู้ตรวจ</h2>
        </div>
        <CardContent className="space-y-5 pt-6">
          <Controller
            control={form.control}
            name="isComplete"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-tint-green p-4 select-none">
                <Checkbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <CheckCircle2 className="size-4" />
                    ตรวจเอกสารครบถ้วนแล้ว
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ยืนยันว่าผู้สมัครส่งเอกสารประกอบการสมัครงานครบถ้วนและพร้อมเข้าสู่ขั้นตอนสัมภาษณ์งาน
                  </p>
                </div>
              </label>
            )}
          />

          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Controller
              control={form.control}
              name="checkedById"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="checkedById">ผู้ตรวจเอกสาร (รหัสพนักงาน)</FieldLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger id="checkedById" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="เลือกพนักงานผู้ตรวจ" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={String(staff.id)}>
                          {staff.code ? `${staff.code} — ` : ""}
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="staffNameDisplay">ชื่อพนักงานผู้ตรวจ</FieldLabel>
              <Input
                id="staffNameDisplay"
                value={
                  selectedStaff
                    ? `${selectedStaff.name}${selectedStaff.position ? ` (${selectedStaff.position})` : ""}`
                    : "-"
                }
                readOnly
                disabled
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ปุ่มท้ายฟอร์ม */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Link
          href="/document-checks"
          className={buttonVariants({
            className: "min-w-28 !bg-destructive text-primary-foreground hover:!bg-destructive/90",
          })}
        >
          <X />
          ยกเลิก
        </Link>
        <Button type="submit" disabled={pending} className="min-w-28">
          <Save />
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </form>
  )
}