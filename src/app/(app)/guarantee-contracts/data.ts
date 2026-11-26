import type { SelectOption } from "@/components/form/fields"
import { formatThaiDate, parseDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { emptyToNull, toInt } from "@/lib/validators"
import type { GuaranteeContractParsed } from "./schema"
import type { GuaranteeContractParties } from "./types"

const MAX_PG_INT = 2_147_483_647

function calculateAge(birthDate: Date | null, refDate: Date): number | null {
  if (!birthDate) return null
  let age = refDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = refDate.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export function toGuaranteeContractData(parsed: GuaranteeContractParsed) {
  const normalized = emptyToNull({
    guarantorName: parsed.guarantorName,
    guarantorNationalId: parsed.guarantorNationalId,
    addressNo: parsed.addressNo,
    moo: parsed.moo,
    road: parsed.road,
    subdistrict: parsed.subdistrict,
    district: parsed.district,
    province: parsed.province,
    guarantorPhone: parsed.guarantorPhone,
  })

  return {
    interviewId: Number(parsed.interviewId),
    contractDate: parseDateInput(parsed.contractDate),
    guarantorName: normalized.guarantorName,
    guarantorAge: toInt(parsed.guarantorAge),
    guarantorNationalId: normalized.guarantorNationalId,
    addressNo: normalized.addressNo,
    moo: normalized.moo,
    road: normalized.road,
    subdistrict: normalized.subdistrict,
    district: normalized.district,
    province: normalized.province,
    guarantorPhone: normalized.guarantorPhone,
  }
}

export async function getGuaranteeContractParties(interviewId: number): Promise<GuaranteeContractParties | null> {
  if (!Number.isInteger(interviewId) || interviewId <= 0 || interviewId > MAX_PG_INT) return null

  const interview = await db.interview.findFirst({
    where: {
      id: interviewId,
      documentCheck: { applicant: { isDraft: false } },
    },
    select: {
      id: true,
      startDate: true,
      position: true,
      customer: {
        select: {
          name: true,
          company: { select: { nameTh: true } },
        },
      },
      documentCheck: {
        select: {
          applicant: {
            select: {
              id: true,
              fullNameTh: true,
              birthDate: true,
              nationalId: true,
              addressNo: true,
              moo: true,
              road: true,
              subdistrict: true,
              district: true,
              province: true,
              mobilePhone: true,
              homePhone: true,
              position: true,
            },
          },
        },
      },
    },
  })

  if (!interview) return null

  const app = interview.documentCheck.applicant
  return {
    interviewId: interview.id,
    applicantId: app.id,
    applicant: {
      fullName: app.fullNameTh,
      age: calculateAge(app.birthDate, new Date()),
      nationalId: app.nationalId,
      addressNo: app.addressNo,
      moo: app.moo,
      road: app.road,
      subdistrict: app.subdistrict,
      district: app.district,
      province: app.province,
      phone: app.mobilePhone ?? app.homePhone ?? null,
      position: interview.position ?? app.position ?? null,
      startDate: interview.startDate,
    },
    company: interview.customer?.company ? { nameTh: interview.customer.company.nameTh } : null,
    customer: interview.customer ? { name: interview.customer.name } : null,
  }
}

export async function getInterviewSelectOptions(includeInterviewId?: number): Promise<SelectOption[]> {
  const interviews = await db.interview.findMany({
    where: {
      OR: [
        { documentCheck: { applicant: { isDraft: false } } },
        ...(includeInterviewId ? [{ id: includeInterviewId }] : []),
      ],
    },
    orderBy: [{ interviewedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    select: {
      id: true,
      interviewedAt: true,
      customer: { select: { name: true } },
      documentCheck: {
        select: {
          applicant: { select: { fullNameTh: true, position: true } },
        },
      },
    },
  })

  return interviews.map((iv) => {
    const app = iv.documentCheck.applicant
    const parts = [
      `#${iv.id} ${app.fullNameTh}`,
      app.position ? `(${app.position})` : null,
      iv.customer?.name ? `· ${iv.customer.name}` : null,
      iv.interviewedAt ? `· สัมภาษณ์ ${formatThaiDate(iv.interviewedAt)}` : null,
    ].filter(Boolean)
    return {
      value: String(iv.id),
      label: parts.join(" "),
    }
  })
}