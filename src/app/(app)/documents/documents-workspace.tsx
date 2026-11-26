"use client"

import { FileText, Printer, Search, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DOCUMENT_TYPES } from "@/lib/menu"
import {
  DocumentPreviewSheet,
  type DocumentTypeName,
  type FullApplicantDocumentData,
} from "./document-templates"

export type ApplicantSelectorOption = {
  id: number
  fullNameTh: string
  position: string | null
  appliedAtIso: string
  interviewedAtIso: string | null
  hasInterview: boolean
}

type Props = {
  applicants: ApplicantSelectorOption[]
  selectedApplicant: FullApplicantDocumentData | null
  initialDocType: DocumentTypeName
}

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function DocumentsWorkspace({ applicants, selectedApplicant, initialDocType }: Props) {
  const router = useRouter()
  const [selectedDocType, setSelectedDocType] = useState<DocumentTypeName>(initialDocType)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [appliedDateFilter, setAppliedDateFilter] = useState("")
  const [interviewDateFilter, setInterviewDateFilter] = useState("")

  const filteredApplicants = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase()
    return applicants.filter((app) => {
      if (appliedDateFilter && app.appliedAtIso !== appliedDateFilter) return false
      if (interviewDateFilter && app.interviewedAtIso !== interviewDateFilter) return false
      if (!kw) return true
      const code = `app-${String(app.id).padStart(4, "0")}`
      return (
        app.fullNameTh.toLowerCase().includes(kw) ||
        code.includes(kw) ||
        (app.position ?? "").toLowerCase().includes(kw)
      )
    })
  }, [applicants, searchKeyword, appliedDateFilter, interviewDateFilter])

  function handleSelectApplicant(nextId: string) {
    if (!nextId) {
      router.push("/documents")
      return
    }
    const params = new URLSearchParams()
    params.set("applicantId", nextId)
    params.set("doc", selectedDocType)
    router.push(`/documents?${params.toString()}`)
  }

  function handleSelectDocType(doc: DocumentTypeName) {
    setSelectedDocType(doc)
    if (selectedApplicant) {
      const params = new URLSearchParams()
      params.set("applicantId", String(selectedApplicant.id))
      params.set("doc", doc)
      router.replace(`/documents?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <div className="space-y-6">
      {/* แถบควบคุมด้านบน (ซ่อนตอนสั่งพิมพ์) */}
      <Card className="print:hidden">
        <CardContent className="space-y-4 pt-6">
          {/* แถวที่ 1: เลือกผู้สมัครงาน + ตัวกรองวันที่ + ปุ่มพิมพ์ */}
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
            <div className="space-y-1.5 lg:col-span-5">
              <label htmlFor="applicantSelect" className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <UserCheck className="size-3.5 text-primary" />
                1. เลือกผู้สมัครงาน (เพื่อดูและพิมพ์เอกสาร)
              </label>
              <select
                id="applicantSelect"
                className={selectClassName}
                value={selectedApplicant ? String(selectedApplicant.id) : ""}
                onChange={(e) => handleSelectApplicant(e.target.value)}
              >
                <option value="">-- กรุณาเลือกผู้สมัครงาน ({filteredApplicants.length} รายการ) --</option>
                {filteredApplicants.map((app) => (
                  <option key={app.id} value={String(app.id)}>
                    APP-{String(app.id).padStart(4, "0")} - {app.fullNameTh}
                    {app.position ? ` (${app.position})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-4 lg:col-span-2">
              <label htmlFor="searchApplicant" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Search className="size-3.5" />
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
              <label htmlFor="appliedDateFilter" className="block text-xs font-medium text-muted-foreground">
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
              <label htmlFor="interviewDateFilter" className="block text-xs font-medium text-muted-foreground">
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
              <Button
                type="button"
                disabled={!selectedApplicant}
                onClick={() => window.print()}
                className="w-full bg-brand-orange text-primary-foreground hover:bg-brand-orange/90"
              >
                <Printer className="size-4" />
                พิมพ์
              </Button>
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
        <DocumentPreviewSheet applicant={selectedApplicant} docType={selectedDocType} />
      ) : (
        <Card className="print:hidden">
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