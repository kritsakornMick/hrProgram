import { A4Sheet, Blank, DocTitle, Signature } from "@/components/document/a4-sheet"
import { formatThaiDateFull } from "@/lib/dates"
import type { BackgroundCheckInput } from "./schema"
import type { DocumentParties } from "./types"

/*
 * หนังสือมอบอำนาจ + หนังสือยินยอมให้ตรวจประวัติอาชญากรรม (2 หน้า A4)
 * ใช้ทั้งตัวอย่างข้างฟอร์ม (อัปเดตทันทีที่พิมพ์) และหน้าพิมพ์ /background-checks/[id]/print
 * ไม่มี hook / ไม่ดึงข้อมูลเอง รับข้อมูลทั้งหมดทาง props
 *
 * TODO(HR): ข้อความในหนังสือเรียบเรียงจากภาพหน้าจอ Access ซึ่งถูกตัดหลายจุด ต้องขอแบบฟอร์มเต็มจาก HR
 *   - หนังสือมอบอำนาจ: ช่อง "โดย ..." หลังชื่อผู้รับมอบ และข้อความ "ในการติดต่อ ..." ทั้งประโยค
 *   - หนังสือยินยอม: ข้อความหลัง "(ประวัติอาชญากรรม)" และข้อ 2 เป็นต้นไป
 */

const ID_PATTERN = /^(\d)(\d{4})(\d{5})(\d{2})(\d)$/

/** 1234567890123 → 1-2345-67890-12-3 */
function formatNationalId(value: string) {
  return value.replace(ID_PATTERN, "$1-$2-$3-$4-$5")
}

export function AuthorizationDocument({
  no,
  values,
  parties,
  size,
}: {
  /** เลขที่หนังสือ (ยังไม่บันทึก = null) */
  no: number | null
  values: BackgroundCheckInput
  /** ข้อมูลจากการสัมภาษณ์ที่เลือก (ยังไม่เลือก = null แสดงช่องว่าง) */
  parties: DocumentParties | null
  size?: "fit" | "actual"
}) {
  const g = parties?.grantor
  const grantorId = g?.nationalId ? formatNationalId(g.nationalId) : ""
  const granteeId = values.granteeNationalId ? formatNationalId(values.granteeNationalId) : ""

  return (
    <>
      {/* หน้า 1: หนังสือมอบอำนาจ */}
      <A4Sheet size={size}>
        <DocTitle>หนังสือมอบอำนาจ</DocTitle>

        <div className="mb-[1.2em] ml-auto w-fit">
          <p>
            เลขที่
            <Blank value={no ? String(no) : ""} width={6} />
          </p>
          <p>
            ทำที่
            <Blank value={parties?.place} width={14} />
          </p>
          <p>
            วันที่
            <Blank value={formatThaiDateFull(values.documentDate)} width={12} />
          </p>
        </div>

        <p className="indent-[3em]">
          ข้าพเจ้า
          <Blank value={g?.fullName} width={14} />
          หมายเลขบัตรประจำตัวประชาชน
          <Blank value={grantorId} width={10} />
          ออกให้ ณ
          <Blank value={values.grantorIdIssuedBy} width={10} />
          วันที่หมดอายุ
          <Blank value={formatThaiDateFull(g?.idCardExpiresAt)} width={9} />
          ขอมอบอำนาจให้
          <Blank value={values.granteeName} width={14} />
          หมายเลขบัตรประจำตัวประชาชน
          <Blank value={granteeId} width={10} />
          ออกให้ ณ
          <Blank value={values.granteeIdIssuedBy} width={10} />
          วันที่หมดอายุ
          <Blank value={formatThaiDateFull(values.granteeIdExpiresAt)} width={9} />
          ซึ่งเป็นผู้มีอำนาจลงนามผูกพันให้กระทำการแทนข้าพเจ้าในการติดต่อ
          <Blank value={values.purpose} width={20} />
          โดยหนังสือมอบอำนาจนี้มีผลบังคับใช้ตั้งแต่วันที่
          <Blank value={formatThaiDateFull(values.effectiveDate)} width={10} />
          เป็นต้นไป
        </p>

        <p className="mt-[1em] indent-[3em]">
          การใดที่ผู้รับมอบอำนาจได้กระทำไปภายในขอบเขตแห่งการมอบอำนาจนี้ ให้มีผลผูกพันข้าพเจ้าเสมือนหนึ่งข้าพเจ้าได้กระทำด้วยตนเอง
          เพื่อเป็นหลักฐาน ข้าพเจ้าจึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
        </p>

        <div className="mt-[3em] grid grid-cols-2 gap-x-[2em] gap-y-[2.5em]">
          <Signature role="ผู้มอบอำนาจ" name={g?.fullName} />
          <Signature role="ผู้รับมอบอำนาจ" name={values.granteeName} />
          <Signature role="พยาน" />
          <Signature role="พยาน" />
        </div>
      </A4Sheet>

      {/* หน้า 2: หนังสือยินยอมตรวจประวัติ */}
      <A4Sheet size={size}>
        <DocTitle sub="(ผ่านหน่วยงาน / บริษัท)">หนังสือยินยอมในการเข้าตรวจดูข้อมูลส่วนบุคคล (ประวัติอาชญากรรม)</DocTitle>

        <p className="mb-[1.2em] text-right">
          วันที่
          <Blank value={formatThaiDateFull(values.documentDate)} width={12} />
        </p>

        <p className="indent-[3em]">
          ข้าพเจ้า
          <Blank value={g?.fullName} width={14} />
          หมายเลขบัตรประจำตัวประชาชน
          <Blank value={grantorId} width={10} />
          อยู่บ้านเลขที่
          <Blank value={g?.addressNo} width={4} />
          หมู่
          <Blank value={g?.moo} width={3} />
          ถนน
          <Blank value={g?.road} width={7} />
          ตำบล/แขวง
          <Blank value={g?.subdistrict} width={7} />
          อำเภอ/เขต
          <Blank value={g?.district} width={7} />
          จังหวัด
          <Blank value={g?.province} width={7} />
          โทรศัพท์
          <Blank value={g?.phone} width={8} />
        </p>

        <p className="mt-[1em] indent-[3em]">
          1. ข้าพเจ้ายินยอมให้
          <Blank value={parties?.customer?.name} width={16} />
          ซึ่งเป็นหน่วยงานของรัฐ หรือบริษัท ห้างร้าน ตั้งอยู่
          <Blank value={parties?.customer?.address} width={20} />
          ซึ่งเป็นหน่วยงานที่ข้าพเจ้าได้สมัครงาน มีสิทธิ์ดำเนินการใดๆ เข้าตรวจดูข้อมูล ข่าวสารส่วนบุคคล (ประวัติอาชญากรรม)
          ของข้าพเจ้า เพื่อประกอบการพิจารณารับเข้าทำงาน
        </p>

        <p className="mt-[1em] indent-[3em]">
          ข้าพเจ้าได้อ่านและเข้าใจข้อความในหนังสือนี้โดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้เป็นหลักฐาน
        </p>

        <div className="mt-[3em] ml-auto w-1/2">
          <Signature role="ผู้ให้ความยินยอม" name={g?.fullName} />
        </div>
      </A4Sheet>
    </>
  )
}
