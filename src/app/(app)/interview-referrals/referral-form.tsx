"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, Loader2, PencilLine, Printer, Save, Send, UserRound, UserPen, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { A4Frame } from "@/components/document/a4-sheet"
import { DateField, SelectField, type SelectOption, TextField } from "@/components/form/fields"
import { FormSection } from "@/components/form/form-section"
import { Button, buttonVariants } from "@/components/ui/button"
import { maskNationalId } from "@/lib/pdpa"
import { cn } from "@/lib/utils"
import { createReferral, loadReferralParties, updateReferral } from "./actions"
import { ReferralDocument } from "./referral-document"
import { emptyReferral, referralSchema, type ReferralInput } from "./schema"
import type { ReferralParties, StaffOption } from "./types"

type Props = {
  /** มี recordId = แก้ไข, ไม่มี = เพิ่มใหม่ */
  recordId?: number
  defaultValues: ReferralInput
  interviewOptions: SelectOption[]
  staffOptions: StaffOption[]
  /** ข้อมูลพนักงานของการสัมภาษณ์ที่บันทึกไว้ (หน้าแก้ไข) */
  initialParties: ReferralParties | null
}

/**
 * ฟอร์มหนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์
 * ซ้าย = ช่องกรอก, ขวา = ตัวอย่างกระดาษ A4 ที่เปลี่ยนตามทันที (จอเล็กสลับดูด้วยแท็บ)
 * พิมพ์ได้หลังบันทึกแล้วเท่านั้น (เอกสารที่พิมพ์ต้องตรงกับที่เก็บในระบบ)
 */
export function ReferralForm({ recordId, defaultValues, interviewOptions, staffOptions, initialParties }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<"form" | "preview">("form")
  const form = useForm<ReferralInput>({ resolver: zodResolver(referralSchema), defaultValues })
  const { control } = form
  const values = { ...emptyReferral, ...useWatch({ control }) }
  const { isDirty } = form.formState

  // ข้อมูลพนักงาน: โหลดใหม่เมื่อเปลี่ยนการสัมภาษณ์ (แสดงเฉพาะที่ตรงกับตัวที่เลือกอยู่)
  const [loadedParties, setLoadedParties] = useState(initialParties)
  const parties = loadedParties && String(loadedParties.interviewId) === values.interviewId ? loadedParties : null
  const loadingParties = values.interviewId !== "" && !parties

  useEffect(() => {
    if (!values.interviewId || String(loadedParties?.interviewId) === values.interviewId) return
    let cancelled = false
    void loadReferralParties(Number(values.interviewId)).then((result) => {
      if (cancelled) return
      if (result.ok && result.data) setLoadedParties(result.data)
      else if (!result.ok) toast.error(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [values.interviewId, loadedParties?.interviewId])

  const issuer = staffOptions.find((s) => s.value === values.issuedById) ?? null

  function onSubmit(data: ReferralInput) {
    startTransition(async () => {
      const result = recordId ? await updateReferral(recordId, data) : await createReferral(data)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof ReferralInput, { message: messages[0] }, { shouldFocus: true })
        }
        return
      }
      toast.success(result.message)
      form.reset(data)
      // ใบใหม่: ไปหน้าแก้ไขของลำดับที่ที่ได้ จะได้กดพิมพ์ต่อได้เลย
      if (!recordId && result.data && "id" in result.data) router.replace(`/interview-referrals/${result.data.id}/edit`)
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
          <FormSection icon={Send} title="หนังสือส่งตัว" contentClassName="space-y-4">
            <SelectField
              control={control}
              name="interviewId"
              label="การสัมภาษณ์ (พนักงานที่ส่งตัว)"
              required
              options={interviewOptions}
              placeholder="-- เลือกการสัมภาษณ์ --"
            />
            <EmployeeSummary parties={parties} loading={loadingParties} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="letterNo" label="เลขที่หนังสือ" placeholder="เช่น สพ.001/2569" />
              <DateField control={control} name="documentDate" label="วันที่ทำหนังสือ" required />
            </div>
            <TextField
              control={control}
              name="addressedTo"
              label="เรียน"
              required
              placeholder="เช่น ผู้จัดการฝ่ายบุคคล"
            />
          </FormSection>

          <FormSection icon={UserPen} title="ผู้ทำหนังสือ" contentClassName="space-y-4">
            <SelectField
              control={control}
              name="issuedById"
              label="พนักงานทำหนังสือ (ลงชื่อท้ายหนังสือ)"
              options={staffOptions}
              placeholder="-- เลือกพนักงาน --"
            />
          </FormSection>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Link href="/interview-referrals" className={buttonVariants({ variant: "outline", className: "min-w-28" })}>
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
            <ReferralDocument no={recordId ?? null} values={values} parties={parties} issuer={issuer} />
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
      href={`/interview-referrals/${recordId}/print?auto=1`}
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

/** สรุปพนักงานจากการสัมภาษณ์ที่เลือก (เลขบัตรซ่อนบางส่วน ตัวเต็มอยู่ในตัวอย่างเอกสาร) */
function EmployeeSummary({ parties, loading }: { parties: ReferralParties | null; loading: boolean }) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        กำลังโหลดข้อมูลพนักงาน...
      </p>
    )
  }
  if (!parties) return null
  const e = parties.employee
  return (
    <div className="flex gap-3 rounded-lg border border-tint-green bg-tint-green/50 px-3 py-2 text-sm">
      <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-semibold">{e.fullName}</p>
        <p className="text-muted-foreground">
          {e.nationalId ? maskNationalId(e.nationalId) : "ไม่มีเลขบัตรในใบสมัคร"}
          {parties.position && ` · ${parties.position}`}
          {parties.customerName ? ` · ${parties.customerName}` : " · ยังไม่ระบุหน่วยงาน"}
        </p>
        <p className="text-xs text-muted-foreground">
          ชื่อ ที่อยู่ เลขบัตร อายุ วุฒิ โทรศัพท์ ดึงจากใบสมัคร · ตำแหน่งและหน่วยงานดึงจากการสัมภาษณ์
        </p>
      </div>
    </div>
  )
}
