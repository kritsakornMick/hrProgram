export type GuaranteeContractParties = {
  interviewId: number
  applicantId: number
  applicant: {
    fullName: string
    age: number | null
    nationalId: string | null
    addressNo: string | null
    moo: string | null
    road: string | null
    subdistrict: string | null
    district: string | null
    province: string | null
    phone: string | null
    position: string | null
    startDate: Date | null
  }
  company: {
    nameTh: string
  } | null
  customer: {
    name: string
  } | null
}