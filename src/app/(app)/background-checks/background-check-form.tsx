"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, FileSignature, Loader2, PencilLine, Printer, Save, UserRound, UserRoundCheck, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { A4Frame } from "@/components/document/a4-sheet"
import { DateField, SelectField, type SelectOption, TextareaField, TextField } from "@/components/form/fields"
import { FormSection } from "@/components/form/form-section"
import { Button, buttonVariants } from "@/components/ui/button"
import { maskNationalId } from "@/lib/pdpa"
import { cn } from "@/lib/utils"
import { createBackgroundCheck, loadDocumentParties, updateBackgroundCheck } from "./actions"
import { AuthorizationDocument } from "./authorization-document"
import { backgroundCheckSchema, emptyBackgroundCheck, type BackgroundCheckInput } from "./schema"
import type { DocumentParties } from "./types"

type Props = {
  /** มี recordId = แก้ไข, ไม่มี = เพิ่มใหม่ */
  recordId?: number
  defaultValues: BackgroundCheckInput
  interviewOptions: SelectOption[]
  /** ข้อมูลผู้มอบอำนาจของการสัมภาษณ์ที่บันทึกไว้ (หน้าแก้ไข) */
  initialParties: DocumentParties | null
}

/**
 * ฟอร์มหนังสือมอบอำนาจและตรวจประวัติ
 * ซ้าย = ช่องกรอก, ขวา = ตัวอย่างกระดาษ A4 ที่เปลี่ยนตามทันที (จอเล็กสลับดูด้วยแท็บ)
 * พิมพ์ได้หลังบันทึกแล้วเท่านั้น (เอกสารที่พิมพ์ต้องตรงกับที่เก็บในระบบ)
 */
export function BackgroundCheckForm({ recordId, defaultValues, interviewOptions, initialParties }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<"form" | "preview">("form")
  const form = useForm<BackgroundCheckInput>({ resolver: zodResolver(backgroundCheckSchema), defaultValues })
  const { control } = form
  const values = { ...emptyBackgroundCheck, ...useWatch({ control }) }
  const { isDirty } = form.formState

  // ข้อมูลผู้มอบอำนาจ: โหลดใหม่เมื่อเปลี่ยนการสัมภาษณ์ (แสดงเฉพาะที่ตรงกับตัวที่เลือกอยู่)
  const [loadedParties, setLoadedParties] = useState(initialParties)
  const parties = loadedParties && String(loadedParties.interviewId) === values.interviewId ? loadedParties : null
  const loadingParties = values.interviewId !== "" && !parties

  useEffect(() => {
    if (!values.interviewId || String(loadedParties?.interviewId) === values.interviewId) return
    let cancelled = false
    void loadDocumentParties(Number(values.interviewId)).then((result) => {
      if (cancelled) return
      if (result.ok && result.data) setLoadedParties(result.data)
      else if (!result.ok) toast.error(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [values.interviewId, loadedParties?.interviewId])

  function onSubmit(data: BackgroundCheckInput) {
    startTransition(async () => {
      const result = recordId ? await updateBackgroundCheck(recordId, data) : await createBackgroundCheck(data)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof BackgroundCheckInput, { message: messages[0] }, { shouldFocus: true })
        }
        return
      }
      toast.success(result.message)
      form.reset(data)
      // ใบใหม่: ไปหน้าแก้ไขของเลขที่ที่ได้ จะได้กดพิมพ์ต่อได้เลย
      if (!recordId && result.data && "id" in result.data) router.replace(`/background-checks/${result.data.id}/edit`)
    })
  }

  const canPrint = Boolean(recordId) && !isDirty

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, () => toast.error("กรุณาตรวจสอบช่องที่มีข้อความสีแดง"))}
      noValidate
      className="space-y-4"
    >
      {/* จอเล็ก: สลับระหว่างฟอร์มกับตัวอย่าง */}
      <div role="tablist" aria-label="มุมมอง" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 xl:hidden">
        {(
          [
            ["form", PencilLine, "กรอกข้อมูล"],
            ["preview", Eye, "ตัวอย่างเอกสาร"],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground",
              view === key && "bg-card text-foreground shadow-xs",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        {/* ---------- ซ้าย: ฟอร์ม ---------- */}
        <div className={cn("min-w-0 space-y-4", view === "preview" && "hidden xl:block")}>
          <FormSection icon={FileSignature} title="หนังสือมอบอำนาจ" contentClassName="space-y-4">
            <SelectField
              control={control}
              name="interviewId"
              label="การสัมภาษณ์ (ผู้มอบอำนาจ)"
              required
              options={interviewOptions}
              placeholder="-- เลือกการสัมภาษณ์ --"
            />
            <GrantorSummary parties={parties} loading={loadingParties} />
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField control={control} name="documentDate" label="วันที่ทำหนังสือ" required />
              <TextField
                control={control}
                name="grantorIdIssuedBy"
                label="บัตรผู้มอบออกให้ ณ"
                placeholder="เช่น อำเภอเมืองนนทบุรี"
              />
            </div>
          </FormSection>

          <FormSection icon={UserRoundCheck} title="ผู้รับมอบอำนาจ" contentClassName="space-y-4">
            <TextField control={control} name="granteeName" label="ชื่อ-สกุล ผู้รับมอบอำนาจ" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="granteeNationalId"
                label="เลขบัตรประชาชน"
                inputMode="numeric"
                maxLength={13}
                placeholder="ตัวเลข 13 หลัก"
              />
              <DateField control={control} name="granteeIdExpiresAt" label="บัตรหมดอายุ" />
            </div>
            <TextField control={control} name="granteeIdIssuedBy" label="บัตรออกให้ ณ" />
          </FormSection>

          <FormSection icon={PencilLine} title="รายละเอียดการมอบอำนาจ" contentClassName="space-y-4">
            <TextareaField
              control={control}
              name="purpose"
              label="มอบอำนาจเพื่อ (ในการติดต่อ)"
              placeholder="เช่น ยื่นคำขอตรวจสอบประวัติอาชญากรรม ณ สำนักงานตำรวจแห่งชาติ"
            />
            <DateField control={control} name="effectiveDate" label="มีผลบังคับใช้ตั้งแต่" />
          </FormSection>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Link href="/background-checks" className={buttonVariants({ variant: "outline", className: "min-w-28" })}>
              <X />
              ยกเลิก
            </Link>
            <Button type="submit" disabled={pending} className="min-w-28">
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </div>

        {/* ---------- ขวา: ตัวอย่าง A4 ---------- */}
        <div
          className={cn(
            "min-w-0 rounded-xl bg-muted p-3 sm:p-4 xl:sticky xl:top-[calc(var(--header-height)+1rem)]",
            "xl:max-h-[calc(100svh-var(--header-height)-2rem)] xl:overflow-y-auto",
            view === "form" && "hidden xl:block",
          )}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">ตัวอย่างเอกสาร (A4)</p>
              <p className="text-xs text-muted-foreground">
                {canPrint ? "ตรงกับข้อมูลที่บันทึกไว้ กดพิมพ์ได้เลย" : "บันทึกก่อน จึงจะพิมพ์ได้"}
              </p>
            </div>
            <PrintButton recordId={recordId} enabled={canPrint} />
          </div>
          <A4Frame>
            <AuthorizationDocument no={recordId ?? null} values={values} parties={parties} />
          </A4Frame>
        </div>
      </div>
    </form>
  )
}

/** ปุ่มพิมพ์: เปิดหน้าพิมพ์ (ข้อมูลที่บันทึกแล้ว) ในแท็บใหม่ และเปิดหน้าต่างพิมพ์ให้เอง */
function PrintButton({ recordId, enabled }: { recordId?: number; enabled: boolean }) {
  if (!recordId || !enabled) {
    return (
      <Button type="button" disabled>
        <Printer />
        พิมพ์
      </Button>
    )
  }
  return (
    <Link
      href={`/background-checks/${recordId}/print?auto=1`}
      // ห้าม prefetch: หน้าพิมพ์บันทึก audit "export" ตอนเปิด ถ้า prefetch จะนับว่าพิมพ์ทั้งที่ยังไม่ได้กด
      prefetch={false}
      target="_blank"
      rel="noopener"
      className={buttonVariants()}
    >
      <Printer />
      พิมพ์
    </Link>
  )
}

/** สรุปผู้มอบอำนาจจากการสัมภาษณ์ที่เลือก (เลขบัตรซ่อนบางส่วน ตัวเต็มอยู่ในตัวอย่างเอกสาร) */
function GrantorSummary({ parties, loading }: { parties: DocumentParties | null; loading: boolean }) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        กำลังโหลดข้อมูลผู้มอบอำนาจ...
      </p>
    )
  }
  if (!parties) return null
  const g = parties.grantor
  return (
    <div className="flex gap-3 rounded-lg border border-tint-green bg-tint-green/50 px-3 py-2 text-sm">
      <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-semibold">{g.fullName}</p>
        <p className="text-muted-foreground">
          {g.nationalId ? maskNationalId(g.nationalId) : "ไม่มีเลขบัตรในใบสมัคร"}
          {parties.customer && ` · ${parties.customer.name}`}
        </p>
        <p className="text-xs text-muted-foreground">ชื่อ เลขบัตร ที่อยู่ ดึงจากใบสมัครอัตโนมัติ (แก้ที่ใบสมัคร)</p>
      </div>
    </div>
  )
}
