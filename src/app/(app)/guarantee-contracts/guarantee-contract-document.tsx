import { A4Sheet, Blank, DocTitle, Signature } from "@/components/document/a4-sheet"
import { formatThaiDateFull } from "@/lib/dates"
import type { GuaranteeContractInput } from "./schema"
import type { GuaranteeContractParties } from "./types"

const ID_PATTERN = /^(\d)(\d{4})(\d{5})(\d{2})(\d)$/

/** 1234567890123 → 1-2345-67890-12-3 */
function formatNationalId(value: string) {
  return value.replace(ID_PATTERN, "$1-$2-$3-$4-$5")
}

export function GuaranteeContractDocument({
  no,
  values,
  parties,
  size,
}: {
  no: number | null
  values: GuaranteeContractInput
  parties: GuaranteeContractParties | null
  size?: "fit" | "actual"
}) {
  const companyName = parties?.company?.nameTh ?? "บริษัท สปีดี้แพคเก็จ เอ็กซ์เพรส จำกัด"
  const guarantorId = values.guarantorNationalId ? formatNationalId(values.guarantorNationalId) : ""
  const app = parties?.applicant
  const applicantId = app?.nationalId ? formatNationalId(app.nationalId) : ""
  const applicantAge = app?.age !== null && app?.age !== undefined ? String(app.age) : ""

  return (
    <A4Sheet size={size}>
      <DocTitle>สัญญาค้ำประกันบุคคลเข้าทำงาน</DocTitle>

      <div className="mb-[1.2em] ml-auto w-fit">
        <p>
          เลขที่สัญญาฯ
          <Blank value={no ? `GC-${String(no).padStart(4, "0")}` : ""} width={8} />
        </p>
        <p>
          ทำที่
          <Blank value={companyName} width={16} />
        </p>
        <p>
          วันที่
          <Blank value={formatThaiDateFull(values.contractDate)} width={12} />
        </p>
      </div>

      <p className="indent-[3em]">
        ข้าพเจ้า
        <Blank value={values.guarantorName} width={15} />
        อายุ
        <Blank value={values.guarantorAge} width={3} />
        ปี บัตรประชาชนเลขที่
        <Blank value={guarantorId} width={11} />
        อยู่บ้านเลขที่
        <Blank value={values.addressNo} width={4} />
        หมู่ที่
        <Blank value={values.moo} width={3} />
        ถนน
        <Blank value={values.road} width={7} />
        ตำบล/แขวง
        <Blank value={values.subdistrict} width={7} />
        อำเภอ/เขต
        <Blank value={values.district} width={7} />
        จังหวัด
        <Blank value={values.province} width={7} />
        โทรศัพท์
        <Blank value={values.guarantorPhone} width={8} />
        ซึ่งต่อไปนี้ในสัญญานี้เรียกว่า <strong>“ผู้ค้ำประกัน”</strong> ขอทำหนังสือสัญญาค้ำประกันฉบับนี้ให้ไว้แก่
        <Blank value={companyName} width={16} />
        ซึ่งต่อไปนี้ในสัญญานี้เรียกว่า <strong>“บริษัท”</strong>
      </p>

      <p className="mt-[1em] indent-[3em]">
        <strong>ข้อ 1.</strong> ตามที่บริษัทได้ตกลงรับ
        <Blank value={app?.fullName} width={15} />
        อายุ
        <Blank value={applicantAge} width={3} />
        ปี บัตรประชาชนเลขที่
        <Blank value={applicantId} width={11} />
        อยู่บ้านเลขที่
        <Blank value={app?.addressNo} width={4} />
        หมู่ที่
        <Blank value={app?.moo} width={3} />
        ถนน
        <Blank value={app?.road} width={7} />
        ตำบล/แขวง
        <Blank value={app?.subdistrict} width={7} />
        อำเภอ/เขต
        <Blank value={app?.district} width={7} />
        จังหวัด
        <Blank value={app?.province} width={7} />
        โทรศัพท์
        <Blank value={app?.phone} width={8} />
        เข้าทำงานในบริษัทตั้งแต่วันที่
        <Blank value={formatThaiDateFull(app?.startDate)} width={10} />
        นั้น ข้าพเจ้ายินยอมเข้าเป็นผู้ค้ำประกันการทำงานของ
        <Blank value={app?.fullName} width={15} />
        ในสภาพลูกจ้างของบริษัทโดยตลอด
      </p>

      <p className="mt-[1em] indent-[3em]">
        <strong>ข้อ 2.</strong> ข้าพเจ้ายอมรับรู้และยินดีรับผิดชอบต่อความเสียหายใดๆ อันเกิดกับการกระทำผิดระเบียบข้อบังคับของบริษัท
        ความประมาทเลินเล่อ และ/หรือโดยทุจริตที่เกิดแก่บริษัท และ/หรือบุคคลภายนอก ทั้งนี้ เฉพาะความเสียหายอันเกิดจากเหตุนอกเหนือจากการปฏิบัติงานตามสมควร
      </p>

      <p className="mt-[1em] indent-[3em]">
        <strong>ข้อ 3.</strong> หากความเสียหายดังกล่าวสามารถประเมินเป็นมูลค่าได้ ข้าพเจ้ายอมเป็นผู้ชดใช้ค่าเสียหายตามมูลค่านั้นให้แก่บริษัท
        พร้อมดอกเบี้ย ค่าปรับ (ถ้ามี) รวมถึงภาระค่าใช้จ่ายอื่นใดในระหว่างดำเนินการเรียกร้องค่าเสียหายจนครบถ้วน
      </p>

      <p className="mt-[1em] indent-[3em]">
        <strong>ข้อ 4.</strong> ข้าพเจ้ายินยอมผูกพันตนตามสัญญาค้ำประกันฉบับนี้ โดยจะไม่เพิกถอนประกันตลอดระยะเวลาที่ผู้ถูกค้ำประกันยังคงสถานภาพลูกจ้างของบริษัท
      </p>

      <p className="mt-[1em] indent-[3em]">
        ข้าพเจ้า “ผู้ค้ำประกัน” ได้อ่านและเข้าใจข้อความในสัญญาค้ำประกันฉบับนี้โดยตลอดแล้ว เห็นว่าถูกต้องตรงตามความประสงค์ทุกประการ จึงลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
      </p>

      <div className="mt-[3em] grid grid-cols-2 gap-x-[2em] gap-y-[2.5em]">
        <Signature role="ผู้ค้ำประกัน" name={values.guarantorName} />
        <Signature role="พยาน" />
        <Signature role="ผู้รับประกัน / บริษัท" />
        <Signature role="พยาน" />
      </div>
    </A4Sheet>
  )
}