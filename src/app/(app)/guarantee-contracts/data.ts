import type { SelectOption } from "@/components/form/fields"
import type { GuaranteeContract } from "@/generated/prisma/client"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { emptyToNull, toInt } from "@/lib/validators"
import { type GuaranteeContractInput, type GuaranteeContractParsed, parsePositiveInt } from "./schema"
import type { GuaranteeContractParties } from "./types"

export function toGuaranteeContractInput(record: GuaranteeContract): GuaranteeContractInput {
  return {
    interviewId: String(record.interviewId),
    contractDate: toDateInput(record.contractDate) || toDateInput(new Date()),
    guarantorName: record.guarantorName ?? "",
    guarantorAge: record.guarantorAge !== null ? String(record.guarantorAge) : "",
    guarantorNationalId: record.guarantorNationalId ?? "",
    addressNo: record.addressNo ?? "",
    moo: record.moo ?? "",
    road: record.road ?? "",
    subdistrict: record.subdistrict ?? "",
    district: record.district ?? "",
    province: record.province ?? "",
    guarantorPhone: record.guarantorPhone ?? "",
  }
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
  if (!parsePositiveInt(interviewId)) return null

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
      birthDate: toDateInput(app.birthDate),
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