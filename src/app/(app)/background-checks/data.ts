import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { SITE } from "@/lib/site"
import type { BackgroundCheckInput } from "./schema"
import type { DocumentParties } from "./types"

/** ส่วนของ query ที่ต้องใช้เติมข้อมูลผู้มอบอำนาจและหน่วยงานลงในหนังสือ */
const partiesSelect = {
  id: true,
  customer: { select: { name: true, address: true, company: { select: { nameTh: true } } } },
  documentCheck: {
    select: {
      applicant: {
        select: {
          id: true,
          fullNameTh: true,
          nationalId: true,
          idCardExpiresAt: true,
          addressNo: true,
          moo: true,
          road: true,
          subdistrict: true,
          district: true,
          province: true,
          mobilePhone: true,
          homePhone: true,
        },
      },
    },
  },
} satisfies Prisma.InterviewSelect

type InterviewWithParties = Prisma.InterviewGetPayload<{ select: typeof partiesSelect }>

function toParties(interview: InterviewWithParties): DocumentParties {
  const a = interview.documentCheck.applicant
  return {
    interviewId: interview.id,
    applicantId: a.id,
    grantor: {
      fullName: a.fullNameTh,
      nationalId: a.nationalId ?? "",
      idCardExpiresAt: toDateInput(a.idCardExpiresAt),
      addressNo: a.addressNo ?? "",
      moo: a.moo ?? "",
      road: a.road ?? "",
      subdistrict: a.subdistrict ?? "",
      district: a.district ?? "",
      province: a.province ?? "",
      phone: a.mobilePhone ?? a.homePhone ?? "",
    },
    customer: interview.customer ? { name: interview.customer.name, address: interview.customer.address ?? "" } : null,
    // TODO(HR): ยืนยันว่า "ทำที่" ใช้ชื่อบริษัทของหน่วยงานลูกค้า (ถ้าไม่มีใช้ชื่อบริษัทเรา) หรือต้องกรอกเอง
    place: interview.customer?.company?.nameTh ?? SITE.companyName,
  }
}

/** ข้อมูลผู้มอบอำนาจและหน่วยงานของการสัมภาษณ์ 1 รายการ (ไม่พบ = null) */
export async function getDocumentParties(interviewId: number) {
  const interview = await db.interview.findUnique({ where: { id: interviewId }, select: partiesSelect })
  return interview ? toParties(interview) : null
}

/** รายการการสัมภาษณ์ให้เลือกในฟอร์ม (ล่าสุดก่อน) แสดงแค่ชื่อ วันที่ หน่วยงาน ไม่ส่งเลขบัตร/ที่อยู่ไป browser */
export async function getInterviewOptions() {
  const interviews = await db.interview.findMany({
    orderBy: [{ interviewedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    select: {
      id: true,
      interviewedAt: true,
      customer: { select: { name: true } },
      documentCheck: { select: { applicant: { select: { fullNameTh: true } } } },
    },
  })
  return interviews.map((i) => ({
    value: String(i.id),
    label: [
      `#${i.id}`,
      i.documentCheck.applicant.fullNameTh,
      i.interviewedAt ? `สัมภาษณ์ ${formatThaiDate(i.interviewedAt)}` : null,
      i.customer?.name,
    ]
      .filter(Boolean)
      .join(" · "),
  }))
}

/** แปลงข้อมูลจากฟอร์มเป็นข้อมูลสำหรับบันทึก */
export function toBackgroundCheckData(d: BackgroundCheckInput) {
  return {
    interviewId: Number(d.interviewId),
    documentDate: parseDateInput(d.documentDate),
    grantorIdIssuedBy: d.grantorIdIssuedBy || null,
    granteeName: d.granteeName || null,
    granteeNationalId: d.granteeNationalId || null,
    granteeIdIssuedBy: d.granteeIdIssuedBy || null,
    granteeIdExpiresAt: parseDateInput(d.granteeIdExpiresAt),
    effectiveDate: parseDateInput(d.effectiveDate),
    purpose: d.purpose || null,
  } satisfies Prisma.BackgroundCheckAuthorizationUncheckedCreateInput
}

type BackgroundCheckRow = Prisma.BackgroundCheckAuthorizationGetPayload<object>

/** แปลงข้อมูลจากฐานข้อมูลเป็นค่าในฟอร์ม */
export function toBackgroundCheckInput(row: BackgroundCheckRow): BackgroundCheckInput {
  return {
    interviewId: String(row.interviewId),
    documentDate: toDateInput(row.documentDate),
    grantorIdIssuedBy: row.grantorIdIssuedBy ?? "",
    granteeName: row.granteeName ?? "",
    granteeNationalId: row.granteeNationalId ?? "",
    granteeIdIssuedBy: row.granteeIdIssuedBy ?? "",
    granteeIdExpiresAt: toDateInput(row.granteeIdExpiresAt),
    effectiveDate: toDateInput(row.effectiveDate),
    purpose: row.purpose ?? "",
  }
}
