"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, FileSignature, Loader2, MapPin, PencilLine, Printer, Save, ShieldCheck, UserRound, X } from "lucide-react"
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
import { createGuaranteeContract, loadGuaranteeParties, updateGuaranteeContract } from "./actions"
import { GuaranteeContractDocument } from "./guarantee-contract-document"
import { createEmptyGuaranteeContract, guaranteeContractSchema, type GuaranteeContractInput } from "./schema"
import type { GuaranteeContractParties } from "./types"

type Props = {
  recordId?: number
  defaultValues: GuaranteeContractInput
  interviewOptions: SelectOption[]
  initialParties: GuaranteeContractParties | null
}

export function GuaranteeContractForm({ recordId, defaultValues, interviewOptions, initialParties }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<"form" | "preview">("form")
  const form = useForm<GuaranteeContractInput>({
    resolver: zodResolver(guaranteeContractSchema),
    defaultValues,
  })
  const { control } = form
  const values = { ...createEmptyGuaranteeContract(""), ...useWatch({ control }) }

  const [loadedParties, setLoadedParties] = useState(initialParties)
  const parties = loadedParties && String(loadedParties.interviewId) === values.interviewId ? loadedParties : null
  const loadingParties = values.interviewId !== "" && !parties

  useEffect(() => {
    if (!values.interviewId || String(loadedParties?.interviewId) === values.interviewId) return
    let cancelled = false
    void loadGuaranteeParties(Number(values.interviewId)).then((result) => {
      if (cancelled) return
      if (result.ok && result.data) setLoadedParties(result.data)
      else if (!result.ok) toast.error(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [values.interviewId, loadedParties?.interviewId])

  function onSubmit(data: GuaranteeContractInput) {
    startTransition(async () => {
      const result = recordId ? await updateGuaranteeContract(recordId, data) : await createGuaranteeContract(data)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) {
            form.setError(name as keyof GuaranteeContractInput, { message: messages[0] }, { shouldFocus: true })
          }
        }
        return
      }
      toast.success(result.message)
      form.reset(data)
      if (!recordId && result.data && "id" in result.data) {
        router.replace(`/guarantee-contracts/${result.data.id}/edit`)
      }
    })
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, () => toast.error("กรุณาตรวจสอบช่องที่มีข้อความสีแดง"))}
      noValidate
      className="space-y-4"
    >
      {/* จอเล็ก: สลับระหว่างฟอร์มกับตัวอย่างสัญญา */}
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
        {/* ซ้าย: ฟอร์มกรอกข้อมูล */}
        <div className={cn("min-w-0 space-y-4", view === "preview" && "hidden xl:block")}>
          <FormSection icon={FileSignature} title="ข้อมูลสัญญาและผู้ถูกค้ำประกัน" contentClassName="space-y-4">
            <SelectField
              control={control}
              name="interviewId"
              label="การสัมภาษณ์ (ผู้ถูกค้ำประกัน)"
              required
              options={interviewOptions}
              placeholder="-- เลือกการสัมภาษณ์ --"
            />
            <ApplicantSummary parties={parties} loading={loadingParties} />
            <DateField control={control} name="contractDate" label="วันที่ทำสัญญาค้ำประกัน" required />
          </FormSection>

          <FormSection icon={ShieldCheck} title="ข้อมูลผู้ค้ำประกัน" contentClassName="space-y-4">
            <TextField control={control} name="guarantorName" label="ชื่อ-สกุล ผู้ค้ำประกัน" required placeholder="เช่น นายสมชาย ใจดี" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={control}
                name="guarantorAge"
                label="อายุ (ปี)"
                inputMode="numeric"
                maxLength={3}
                placeholder="เช่น 45"
              />
              <TextField
                control={control}
                name="guarantorPhone"
                label="เบอร์โทรศัพท์ผู้ค้ำ"
                inputMode="tel"
                placeholder="เช่น 081-234-5678"
              />
            </div>
            <TextField
              control={control}
              name="guarantorNationalId"
              label="เลขบัตรประชาชนผู้ค้ำ"
              inputMode="numeric"
              maxLength={13}
              placeholder="ตัวเลข 13 หลัก"
            />
          </FormSection>

          <FormSection icon={MapPin} title="ที่อยู่ผู้ค้ำประกัน" contentClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="addressNo" label="บ้านเลขที่" placeholder="เช่น 99/1" />
              <TextField control={control} name="moo" label="หมู่ที่" placeholder="เช่น 5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="road" label="ถนน" />
              <TextField control={control} name="subdistrict" label="ตำบล / แขวง" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name="district" label="อำเภอ / เขต" />
              <TextField control={control} name="province" label="จังหวัด" />
            </div>
          </FormSection>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Link href="/guarantee-contracts" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
              <X />
              ยกเลิก
            </Link>
            <Button type="submit" size="lg" disabled={pending} className="h-10 px-4">
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </div>

        {/* ขวา: ตัวอย่างเอกสาร A4 */}
        <div
          className={cn(
            "min-w-0 rounded-xl bg-muted p-3 sm:p-4 xl:sticky xl:top-[calc(var(--header-height)+1rem)]",
            "xl:max-h-[calc(100svh-var(--header-height)-2rem)] xl:overflow-y-auto",
            view === "form" && "hidden xl:block",
          )}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">ตัวอย่างเอกสาร (A4)</p>
              <p className="text-xs text-muted-foreground">
                {recordId ? "บันทึกก่อนพิมพ์ เพื่อให้เอกสารตรงกับที่เก็บ" : "บันทึกก่อน จึงจะพิมพ์ได้"}
              </p>
            </div>
            {recordId ? (
              <Link
                href={`/guarantee-contracts/${recordId}/print`}
                // ห้าม prefetch: หน้าพิมพ์บันทึก audit "export" ตอนเปิด
                prefetch={false}
                target="_blank"
                className={buttonVariants({ size: "sm" })}
              >
                <Printer />
                พิมพ์
              </Link>
            ) : (
              <Button type="button" size="sm" disabled>
                <Printer />
                พิมพ์
              </Button>
            )}
          </div>
          <A4Frame>
            <GuaranteeContractDocument no={recordId ?? null} values={values} parties={parties} />
          </A4Frame>
        </div>
      </div>
    </form>
  )
}

function ApplicantSummary({ parties, loading }: { parties: GuaranteeContractParties | null; loading: boolean }) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        กำลังโหลดข้อมูลผู้ถูกค้ำประกัน...
      </p>
    )
  }
  if (!parties) return null
  const app = parties.applicant
  return (
    <div className="flex gap-3 rounded-lg border border-tint-green bg-tint-green/50 px-3 py-2 text-sm">
      <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-semibold">{app.fullName}</p>
        <p className="text-muted-foreground">
          {app.nationalId ? maskNationalId(app.nationalId) : "ไม่มีเลขบัตรในใบสมัคร"}
          {parties.customer && ` · ${parties.customer.name}`}
        </p>
        <p className="text-xs text-muted-foreground">ข้อมูลผู้สมัครดึงจากใบสมัครอัตโนมัติ (แก้ที่ใบสมัคร)</p>
      </div>
    </div>
  )
}