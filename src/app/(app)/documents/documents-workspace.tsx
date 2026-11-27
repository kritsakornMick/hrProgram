"use client"

import { FileText, Printer, Search, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { SelectField, type SelectOption } from "@/components/form/fields"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DOCUMENT_TYPES } from "@/lib/menu"
import type { ApplicantSelectorOption } from "./data"
import {
  DocumentPreviewSheet,
  type DocumentTypeName,
  type FullApplicantDocumentData,
} from "./document-templates"

type Props = {
  applicants: ApplicantSelectorOption[]
  selectedApplicant: FullApplicantDocumentData | null
  initialDocType: DocumentTypeName
  initialQuery: string
  initialAppliedDate: string
  initialInterviewDate: string
}

type SelectorFormValues = {
  applicantId: string
}

export function DocumentsWorkspace({
  applicants,
  selectedApplicant,
  initialDocType,
  initialQuery,
  initialAppliedDate,
  initialInterviewDate,
}: Props) {
  const router = useRouter()
  const [selectedDocType, setSelectedDocType] = useState<DocumentTypeName>(initialDocType)
  const [searchKeyword, setSearchKeyword] = useState(initialQuery)
  const [appliedDateFilter, setAppliedDateFilter] = useState(initialAppliedDate)
  const [interviewDateFilter, setInterviewDateFilter] = useState(initialInterviewDate)

  const form = useForm<SelectorFormValues>({
    defaultValues: {
      applicantId: selectedApplicant ? String(selectedApplicant.id) : "",
    },
  })

  useEffect(() => {
    form.reset({
      applicantId: selectedApplicant ? String(selectedApplicant.id) : "",
    })
  }, [selectedApplicant, form])

  const watchedApplicantId = useWatch({ control: form.control, name: "applicantId" })

  useEffect(() => {
    const currentId = selectedApplicant ? String(selectedApplicant.id) : ""
    if (watchedApplicantId === currentId) return

    const params = new URLSearchParams()
    if (watchedApplicantId) {
      params.set("applicantId", watchedApplicantId)
      params.set("doc", selectedDocType)
    }
    if (searchKeyword.trim()) params.set("q", searchKeyword.trim())
    if (appliedDateFilter) params.set("appliedDate", appliedDateFilter)
    if (interviewDateFilter) params.set("interviewDate", interviewDateFilter)

    const qs = params.toString()
    router.push(qs ? `/documents?${qs}` : "/documents")
  }, [watchedApplicantId, selectedApplicant, selectedDocType, searchKeyword, appliedDateFilter, interviewDateFilter, router])

  // ค้นหาจากฝั่ง Server (จำกัดจำนวนผลลัพธ์ ไม่โหลดผู้สมัครทั้งหมดลง browser)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        searchKeyword.trim() === initialQuery &&
        appliedDateFilter === initialAppliedDate &&
        interviewDateFilter === initialInterviewDate
      ) {
        return
      }
      const params = new URLSearchParams()
      if (selectedApplicant) {
        params.set("applicantId", String(selectedApplicant.id))
        params.set("doc", selectedDocType)
      }
      if (searchKeyword.trim()) params.set("q", searchKeyword.trim())
      if (appliedDateFilter) params.set("appliedDate", appliedDateFilter)
      if (interviewDateFilter) params.set("interviewDate", interviewDateFilter)
      const qs = params.toString()
      router.replace(qs ? `/documents?${qs}` : "/documents", { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [
    searchKeyword,
    appliedDateFilter,
    interviewDateFilter,
    initialQuery,
    initialAppliedDate,
    initialInterviewDate,
    selectedApplicant,
    selectedDocType,
    router,
  ])

  const applicantOptions: SelectOption[] = applicants.map((app) => ({
    value: String(app.id),
    label: `APP-${String(app.id).padStart(4, "0")} - ${app.fullNameTh}${app.position ? ` (${app.position})` : ""}`,
  }))

  function handleSelectDocType(doc: DocumentTypeName) {
    setSelectedDocType(doc)
    if (selectedApplicant) {
      const params = new URLSearchParams()
      params.set("applicantId", String(selectedApplicant.id))
      params.set("doc", doc)
      if (searchKeyword.trim()) params.set("q", searchKeyword.trim())
      if (appliedDateFilter) params.set("appliedDate", appliedDateFilter)
      if (interviewDateFilter) params.set("interviewDate", interviewDateFilter)
      router.replace(`/documents?${params.toString()}`, { scroll: false })
    }
  }

  const printHref = selectedApplicant
    ? `/documents/print?applicantId=${selectedApplicant.id}&doc=${encodeURIComponent(selectedDocType)}&auto=1`
    : ""

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* แถวที่ 1: เลือกผู้สมัครงาน (SelectField) + ตัวกรอง + ปุ่มเปิดหน้าพิมพ์ */}
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <SelectField
                control={form.control}
                name="applicantId"
                label="1. เลือกผู้สมัครงาน (แสดงสูงสุด 50 รายการล่าสุด)"
                options={applicantOptions}
                placeholder={`-- กรุณาเลือกผู้สมัครงาน (${applicants.length} รายการ) --`}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-4 lg:col-span-2">
              <label
                htmlFor="searchApplicant"
                className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-foreground"
              >
                <Search className="size-3.5 text-muted-foreground" />
                ค้นหาชื่อ / รหัส
              </label>
              <Input
                id="searchApplicant"
                placeholder="ชื่อ หรือ APP-..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-4 lg:col-span-2">
              <label htmlFor="appliedDateFilter" className="block text-[0.8rem] font-semibold text-foreground">
                วันที่สมัคร
              </label>
              <Input
                id="appliedDateFilter"
                type="date"
                value={appliedDateFilter}
                onChange={(e) => setAppliedDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-4 lg:col-span-2">
              <label htmlFor="interviewDateFilter" className="block text-[0.8rem] font-semibold text-foreground">
                วันที่สัมภาษณ์
              </label>
              <Input
                id="interviewDateFilter"
                type="date"
                value={interviewDateFilter}
                onChange={(e) => setInterviewDateFilter(e.target.value)}
              />
            </div>

            <div className="lg:col-span-1">
              {selectedApplicant ? (
                <a
                  href={printHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants()} w-full bg-brand-orange text-primary-foreground hover:bg-brand-orange/90`}
                >
                  <Printer className="size-4" />
                  พิมพ์
                </a>
              ) : (
                <Button
                  type="button"
                  disabled
                  className="w-full bg-brand-orange text-primary-foreground"
                >
                  <Printer className="size-4" />
                  พิมพ์
                </Button>
              )}
            </div>
          </div>

          {/* แถวที่ 2: ปุ่มเลือกประเภทเอกสารทั้ง 12 แบบ */}
          <div className="space-y-2 border-t pt-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <FileText className="size-3.5 text-primary" />
              2. เลือกแบบฟอร์มเอกสาร (12 แบบ)
            </p>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map((doc, idx) => {
                const isActive = selectedDocType === doc
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => handleSelectDocType(doc)}
                    className={
                      isActive
                        ? "rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors"
                        : "rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-tint-green hover:text-foreground"
                    }
                  >
                    {idx + 1}. {doc}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* พื้นที่แสดงตัวอย่างเอกสาร (A4 Preview) */}
      {selectedApplicant ? (
        <DocumentPreviewSheet applicant={selectedApplicant} docType={selectedDocType} mode="preview" />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-tint-green p-4 text-primary">
              <UserCheck className="size-8" />
            </div>
            <h3 className="mt-4 text-base font-semibold">กรุณาเลือกผู้สมัครงานก่อน</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              เลือกชื่อผู้สมัครจากช่องด้านบน เพื่อแสดงตัวอย่างเอกสารแนบท้ายใบสมัครทั้ง 12 แบบและสั่งพิมพ์
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}