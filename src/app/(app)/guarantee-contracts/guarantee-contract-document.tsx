import { formatThaiDateLong } from "@/lib/dates"

export type GuaranteeContractDocumentData = {
  id: number
  contractDate: Date | null
  guarantorName: string | null
  guarantorAge: number | null
  guarantorNationalId: string | null
  addressNo: string | null
  moo: string | null
  road: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
  guarantorPhone: string | null
}

function valueOrDots(value: string | number | null | undefined, dots = "............................") {
  if (value === null || value === undefined || value === "") return dots
  return String(value)
}

function formatAddress(address: GuaranteeContractDocumentData) {
  const parts = [
    address.addressNo && `บ้านเลขที่ ${address.addressNo}`,
    address.moo && `หมู่ ${address.moo}`,
    address.road && `ถนน${address.road}`,
    address.subdistrict && `แขวง/ตำบล${address.subdistrict}`,
    address.district && `เขต/อำเภอ${address.district}`,
    address.province && `จังหวัด${address.province}`,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(" ") : "...................................................................."
}

function dateLongOrDots(date: Date | null | undefined) {
  if (!date) return "......../................/........"
  return formatThaiDateLong(date)
}

export function GuaranteeContractDocument({
  contract,
  companyName,
  applicant,
}: {
  contract: GuaranteeContractDocumentData | null
  companyName: string
  applicant: { fullNameTh: string; nationalId: string | null; position: string | null }
}) {
  return (
    <>
      <p className="indent-[2em]">
        ทำที่ <strong>{companyName}</strong> วันที่ <strong>{dateLongOrDots(contract?.contractDate)}</strong>
      </p>
      <p className="indent-[2em]">
        ข้าพเจ้า <strong>{valueOrDots(contract?.guarantorName)}</strong> อายุ{" "}
        <strong>{valueOrDots(contract?.guarantorAge, "......")}</strong> ปี เลขประจำตัวประชาชน{" "}
        <strong>{valueOrDots(contract?.guarantorNationalId)}</strong> อยู่บ้านเลขที่{" "}
        {contract ? formatAddress(contract) : "...................................................................."} โทรศัพท์{" "}
        <strong>{valueOrDots(contract?.guarantorPhone)}</strong> ซึ่งต่อไปนี้เรียกว่า &ldquo;ผู้ค้ำประกัน&rdquo;
      </p>
      <p className="indent-[2em]">
        ขอทำสัญญาค้ำประกันให้ไว้แก่ <strong>{companyName}</strong> เพื่อค้ำประกันการทำงานของ{" "}
        <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valueOrDots(applicant.nationalId)}</strong>{" "}
        ซึ่งเข้าทำงานในตำแหน่ง <strong>{valueOrDots(applicant.position)}</strong>{" "}
        หากผู้ถูกค้ำประกันกระทำการทุจริตหรือก่อให้เกิดความเสียหายแก่นายจ้างหรือลูกค้าของนายจ้าง
        ผู้ค้ำประกันยินยอมรับผิดชดใช้ค่าเสียหายแทนตามขอบเขตที่กฎหมายกำหนด
      </p>
      <div className="mt-[3em] grid grid-cols-1 gap-[1em] pt-[1em] text-center text-[0.9em] sm:grid-cols-2 sm:gap-[2em]">
        <div className="space-y-[0.375em]">
          <p>ลงชื่อ ...................................................... ผู้ค้ำประกัน</p>
          <p>({valueOrDots(contract?.guarantorName, "........................................")})</p>
          <p className="text-[0.75em] text-muted-foreground">วันที่ ........./................/...........</p>
        </div>
        <div className="space-y-[0.375em]">
          <p>ลงชื่อ ...................................................... พยาน / ผู้รับสัญญา</p>
          <p>({companyName})</p>
          <p className="text-[0.75em] text-muted-foreground">วันที่ ........./................/...........</p>
        </div>
      </div>
    </>
  )
}
