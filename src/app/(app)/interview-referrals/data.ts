import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { SITE } from "@/lib/site"
import type { ReferralInput } from "./schema"
import type { ReferralParties, StaffOption } from "./types"

/** ส่วนของ query ที่ต้องใช้เติมข้อมูลพนักงาน หน่วยงาน และบริษัทลงในหนังสือ */
const partiesSelect = {
  id: true,
  position: true,
  customer: {
    select: { name: true, company: { select: { nameTh: true, address: true, phone: true } } },
  },
  documentCheck: {
    select: {
      applicant: {
        select: {
          id: true,
          fullNameTh: true,
          position: true,
          nationalId: true,
          birthDate: true,
          educationLevel: true,
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

function joinAddress(a: InterviewWithParties["documentCheck"]["applicant"]) {
  return [
    a.addressNo,
    a.moo && `หมู่ ${a.moo}`,
    a.road && `ถนน${a.road}`,
    a.subdistrict,
    a.district,
    a.province,
  ]
    .filter(Boolean)
    .join(" ")
}

function toParties(interview: InterviewWithParties): ReferralParties {
  const a = interview.documentCheck.applicant
  const company = interview.customer?.company
  return {
    interviewId: interview.id,
    applicantId: a.id,
    employee: {
      fullName: a.fullNameTh,
      address: joinAddress(a),
      nationalId: a.nationalId ?? "",
      birthDate: toDateInput(a.birthDate),
      educationLevel: a.educationLevel ?? "",
      phone: a.mobilePhone ?? a.homePhone ?? "",
    },
    position: interview.position ?? a.position ?? "",
    customerName: interview.customer?.name ?? "",
    // เหมือน Access: บริษัทผู้ส่งตัว = บริษัทที่หน่วยงานลูกค้าสังกัด (ไม่มี = ชื่อบริษัทหลัก)
    company: {
      name: company?.nameTh ?? SITE.companyName,
      address: company?.address ?? "",
      phone: company?.phone ?? "",
    },
  }
}

/** ข้อมูลพนักงานและหน่วยงานของการสัมภาษณ์ 1 รายการ (ไม่พบ = null) */
export async function getReferralParties(interviewId: number) {
  const interview = await db.interview.findUnique({ where: { id: interviewId }, select: partiesSelect })
  return interview ? toParties(interview) : null
}

/**
 * รายการการสัมภาษณ์ให้เลือกในฟอร์ม (ล่าสุดก่อน) ตาม Access: วันที่สัมภาษณ์ ชื่อ หน่วยงาน ตำแหน่ง ผล
 * ไม่ส่งเลขบัตร/ที่อยู่ไป browser
 */
export async function getInterviewOptions() {
  const interviews = await db.interview.findMany({
    orderBy: [{ interviewedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    select: {
      id: true,
      interviewedAt: true,
      position: true,
      result: true,
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
      i.position,
      i.result,
    ]
      .filter(Boolean)
      .join(" · "),
  }))
}

/** พนักงานผู้ทำหนังสือ (ชื่อ + ตำแหน่ง ใช้ลงท้ายหนังสือ) */
export async function getStaffOptions(): Promise<StaffOption[]> {
  const staff = await db.staff.findMany({
    orderBy: [{ code: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true, position: true },
  })
  return staff.map((s) => ({
    value: String(s.id),
    label: [s.code, s.name, s.position].filter(Boolean).join(" · "),
    name: s.name,
    position: s.position ?? "",
  }))
}

/** แปลงข้อมูลจากฟอร์มเป็นข้อมูลสำหรับบันทึก */
export function toReferralData(d: ReferralInput) {
  return {
    interviewId: Number(d.interviewId),
    letterNo: d.letterNo || null,
    documentDate: parseDateInput(d.documentDate),
    addressedTo: d.addressedTo || null,
    issuedById: d.issuedById ? Number(d.issuedById) : null,
  } satisfies Prisma.InterviewReferralLetterUncheckedCreateInput
}

type ReferralRow = Prisma.InterviewReferralLetterGetPayload<object>

/** แปลงข้อมูลจากฐานข้อมูลเป็นค่าในฟอร์ม */
export function toReferralInput(row: ReferralRow): ReferralInput {
  return {
    interviewId: String(row.interviewId),
    letterNo: row.letterNo ?? "",
    documentDate: toDateInput(row.documentDate),
    addressedTo: row.addressedTo ?? "",
    issuedById: row.issuedById ? String(row.issuedById) : "",
  }
}
