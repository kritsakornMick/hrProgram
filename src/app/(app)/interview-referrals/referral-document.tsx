import dayjs from "dayjs"
import { A4Sheet, Blank } from "@/components/document/a4-sheet"
import { formatThaiDateFull } from "@/lib/dates"
import type { ReferralInput } from "./schema"
import type { ReferralParties } from "./types"

/*
 * หนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์ (1 หน้า A4) ตาม rpt-หนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์ ใน Access
 * ใช้ทั้งตัวอย่างข้างฟอร์ม (อัปเดตทันทีที่พิมพ์) และหน้าพิมพ์ /interview-referrals/[id]/print
 * ไม่มี hook / ไม่ดึงข้อมูลเอง รับข้อมูลทั้งหมดทาง props
 *
 * TODO(HR): ข้อความเรียบเรียงจากหน้าฟอร์ม Access ต้องเทียบกับหนังสือจริงที่พิมพ์จาก Access
 *   - ประโยคปิดท้าย "จึงเรียนมาเพื่อโปรดพิจารณา" และ "ขอแสดงความนับถือ"
 * TODO(Tech Lead, ขั้น 2): หัวกระดาษ/ท้ายกระดาษเป็นรูป (company.headerImage/footerImage),
 *   รูปถ่ายผู้สมัคร (ไฟล์แนบ PHOTO) และลายเซ็นพนักงาน (staff.signaturePath) หลังทำ module เก็บไฟล์
 */

const ID_PATTERN = /^(\d)(\d{4})(\d{5})(\d{2})(\d)$/

/** 1234567890123 → 1-2345-67890-12-3 */
function formatNationalId(value: string) {
  return value.replace(ID_PATTERN, "$1-$2-$3-$4-$5")
}

/** อายุเป็นปีเต็ม ณ วันที่ทำหนังสือ (ยังไม่ระบุวันที่ = วันนี้) */
function ageOn(birthDate: string, onDate: string) {
  if (!birthDate) return ""
  const birth = dayjs(birthDate)
  const at = onDate ? dayjs(onDate) : dayjs()
  if (!birth.isValid() || !at.isValid()) return ""
  const years = at.diff(birth, "year")
  return years >= 0 ? `${years} ปี` : ""
}

export function ReferralDocument({
  no,
  values,
  parties,
  issuer,
  size,
}: {
  /** ลำดับที่หนังสือ (ยังไม่บันทึก = null) */
  no: number | null
  values: ReferralInput
  /** ข้อมูลจากการสัมภาษณ์ที่เลือก (ยังไม่เลือก = null แสดงช่องว่าง) */
  parties: ReferralParties | null
  /** พนักงานผู้ทำหนังสือ (ยังไม่เลือก = null) */
  issuer: { name: string; position: string } | null
  size?: "fit" | "actual"
}) {
  const e = parties?.employee
  const company = parties?.company

  return (
    <A4Sheet size={size}>
      {/* หัวกระดาษ (ชั่วคราวเป็นตัวอักษร จนกว่าจะอัปโหลดรูปหัวกระดาษได้) */}
      <header className="mb-[1.2em] border-b-2 border-current pb-[0.5em] text-center">
        <p className="text-[1.25em] leading-snug font-bold">{company?.name || " "}</p>
        {company?.address && <p className="text-[0.9em] leading-snug">{company.address}</p>}
        {company?.phone && <p className="text-[0.9em] leading-snug">โทร {company.phone}</p>}
      </header>

      <div className="flex items-start justify-between gap-[1em]">
        <p>
          ที่
          <Blank value={values.letterNo} width={8} />
        </p>
        <p className="text-right text-[0.85em] whitespace-nowrap">ลำดับที่ {no ?? "-"}</p>
      </div>
      <p className="mb-[1em] text-right">
        วันที่
        <Blank value={formatThaiDateFull(values.documentDate)} width={12} />
      </p>

      <p>
        <span className="inline-block w-[3.5em] font-bold">เรื่อง</span>
        ขอจัดส่งพนักงานเข้าสัมภาษณ์
      </p>
      <p className="mb-[1em]">
        <span className="inline-block w-[3.5em] font-bold">เรียน</span>
        <Blank value={values.addressedTo} width={22} />
      </p>

      <p className="indent-[3em]">
        <Blank value={company?.name} width={14} />
        มีความประสงค์ขอจัดส่งพนักงาน เพื่อเข้าสัมภาษณ์ ตำแหน่ง
        <Blank value={parties?.position} width={10} />
        ประจำที่หน่วยงาน
        <Blank value={parties?.customerName} width={14} />
        โดยมีรายละเอียดดังนี้
      </p>

      <div className="mt-[1em] flex items-start gap-[1.5em] pl-[3em]">
        <dl className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-[0.8em]">
          <Detail label="ชื่อ" value={e?.fullName} />
          <Detail label="ที่อยู่" value={e?.address} />
          <Detail label="เลขที่บัตรประชาชน" value={e?.nationalId ? formatNationalId(e.nationalId) : ""} />
          <Detail label="อายุ" value={e ? ageOn(e.birthDate, values.documentDate) : ""} />
          <Detail label="วุฒิการศึกษา" value={e?.educationLevel} />
          <Detail label="หมายเลขโทรศัพท์" value={e?.phone} />
        </dl>
        {/* ช่องติดรูปถ่าย 1 นิ้ว (ประมาณ 2.5 × 3 ซม.) */}
        <div className="flex h-[7.3em] w-[6.1em] shrink-0 items-center justify-center border border-current text-center text-[0.8em] leading-tight">
          ติดรูปถ่าย
        </div>
      </div>

      <p className="mt-[1em] indent-[3em]">จึงเรียนมาเพื่อโปรดพิจารณา</p>

      <div className="mt-[2em] ml-auto w-1/2 text-center">
        <p>ขอแสดงความนับถือ</p>
        <p className="mt-[2.5em]">
          (<Blank value={issuer?.name} width={11} />)
        </p>
        <p>
          <Blank value={issuer?.position} width={11} />
        </p>
      </div>
    </A4Sheet>
  )
}

/** 1 บรรทัดในรายละเอียดพนักงาน: หัวข้อ + ค่า (ขีดเส้นจุด) */
function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="whitespace-nowrap">{label}</dt>
      <dd className="min-w-0 border-b border-dotted border-current px-[0.3em] leading-[1.45]">{value || " "}</dd>
    </>
  )
}
