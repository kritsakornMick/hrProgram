import { A4Frame, A4Sheet } from "@/components/document/a4-sheet"
import { formatThaiDate, formatThaiDateLong } from "@/lib/dates"
import type { DOCUMENT_TYPES } from "@/lib/menu"

export type DocumentTypeName = (typeof DOCUMENT_TYPES)[number]

export type FullApplicantDocumentData = {
  id: number
  appliedAt: Date
  position: string | null
  expectedSalary: string | null
  fullNameTh: string
  fullNameEn: string | null
  nationalId: string | null
  idCardIssuedAt: Date | null
  idCardExpiresAt: Date | null
  birthDate: Date | null
  weightKg: string | null
  heightCm: string | null
  ethnicity: string | null
  nationality: string | null
  religion: string | null
  addressNo: string | null
  moo: string | null
  road: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
  homePhone: string | null
  mobilePhone: string | null
  maritalStatus: string | null
  spouseName: string | null
  militaryStatus: string | null
  educationLevel: string | null
  lastInstitution: string | null
  major: string | null
  gpa: string | null
  graduationYear: string | null
  lastEmployer: string | null
  lastPosition: string | null
  lastSalary: string | null
  leavingReason: string | null
  emergencyContactName: string | null
  emergencyContactRelation: string | null
  emergencyContactPhone: string | null
  hasCriminalRecord: boolean
  criminalRecordDetail: string | null
  consentCriminalCheck: string | null
  consentHealthCheck: string | null
  consentIdentity: string | null
  consentReference: string | null
  latestDocCheck: {
    id: number
    checkedAt: Date | null
    hasPhoto: boolean
    hasIdCard: boolean
    hasHouseRegistration: boolean
    hasEducationCert: boolean
    hasCarLicense: boolean
    carLicenseType: string | null
    hasMotorcycleLicense: boolean
    hasDisabilityCard: boolean
    hasMilitaryDoc: boolean
    hasOther: boolean
    isComplete: boolean
    comment: string | null
    checkedByName: string | null
  } | null
  latestInterview: {
    id: number
    interviewedAt: Date | null
    result: string | null
    employmentStatus: string | null
    wageRate: string | null
    position: string | null
    startDate: Date | null
    probationStartDate: Date | null
    probationEndDate: Date | null
    probationDays: number | null
    bankName: string | null
    bankAccountNo: string | null
    customerName: string | null
    customerJobName: string | null
    customerAddress: string | null
    companyNameTh: string | null
    companyAddress: string | null
    companyPhone: string | null
    companyTaxId: string | null
    interviewerName: string | null
    employmentContract: { id: number; contractDate: Date | null } | null
    backgroundCheck: {
      id: number
      granteeName: string | null
      granteeNationalId: string | null
      granteeIdIssuedBy: string | null
      granteeIdExpiresAt: Date | null
      effectiveDate: Date | null
      purpose: string | null
      grantorIdIssuedBy: string | null
      documentDate: Date | null
    } | null
    interviewReferral: {
      id: number
      letterNo: string | null
      documentDate: Date | null
      addressedTo: string | null
      issuedByName: string | null
    } | null
    assignmentLetter: {
      id: number
      letterNo: string | null
      documentDate: Date | null
      addressedTo: string | null
      issuedByName: string | null
    } | null
    guaranteeContract: {
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
    } | null
  } | null
  defaultCompany: {
    nameTh: string
    address: string | null
    phone: string | null
    taxId: string | null
  } | null
}

function formatAddress(addr: {
  addressNo: string | null
  moo: string | null
  road: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
}) {
  const parts = [
    addr.addressNo && `บ้านเลขที่ ${addr.addressNo}`,
    addr.moo && `หมู่ ${addr.moo}`,
    addr.road && `ถนน${addr.road}`,
    addr.subdistrict && `แขวง/ตำบล${addr.subdistrict}`,
    addr.district && `เขต/อำเภอ${addr.district}`,
    addr.province && `จังหวัด${addr.province}`,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "...................................................................."
}

function formatMoney(val: string | null) {
  if (!val) return "-"
  const num = Number(val)
  return Number.isFinite(num) ? num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val
}

function valOrDots(val: string | number | null | undefined, dots = "............................") {
  if (val === null || val === undefined || val === "") return dots
  return String(val)
}

function dateLongOrDots(date: Date | null | undefined) {
  if (!date) return "......../................/........"
  return formatThaiDateLong(date)
}

function SignatureBlock({
  leftLabel,
  leftName,
  rightLabel,
  rightName,
}: {
  leftLabel: string
  leftName: string
  rightLabel: string
  rightName: string
}) {
  return (
    <div className="mt-[3em] grid grid-cols-1 gap-[1em] pt-[1em] text-center text-[0.9em] sm:grid-cols-2 sm:gap-[2em]">
      <div className="space-y-[0.375em]">
        <p>ลงชื่อ ...................................................... {leftLabel}</p>
        <p>({leftName})</p>
        <p className="text-[0.75em] text-muted-foreground">วันที่ ........./................/...........</p>
      </div>
      <div className="space-y-[0.375em]">
        <p>ลงชื่อ ...................................................... {rightLabel}</p>
        <p>({rightName})</p>
        <p className="text-[0.75em] text-muted-foreground">วันที่ ........./................/...........</p>
      </div>
    </div>
  )
}

function MissingRecordBanner({ message }: { message: string }) {
  return (
    <div className="mb-[1em] rounded-lg border border-brand-orange/40 bg-tint-orange px-[1em] py-[0.6em] text-[0.75em] text-brand-orange print:hidden">
      หมายเหตุ: {message} (ระบบแสดงแบบฟอร์มเปล่าในส่วนที่ยังไม่มีข้อมูล)
    </div>
  )
}

export function DocumentPreviewSheet({
  applicant,
  docType,
}: {
  applicant: FullApplicantDocumentData
  docType: DocumentTypeName
}) {
  const companyName = applicant.latestInterview?.companyNameTh || applicant.defaultCompany?.nameTh || "บริษัท สปีดี้แพคเก็จ เอ็กซ์เพรส จำกัด"
  const companyAddress = applicant.latestInterview?.companyAddress || applicant.defaultCompany?.address || "-"
  const companyPhone = applicant.latestInterview?.companyPhone || applicant.defaultCompany?.phone || "-"
  const appCode = `APP-${String(applicant.id).padStart(4, "0")}`
  const applicantAddress = formatAddress(applicant)
  const interview = applicant.latestInterview
  const docCheck = applicant.latestDocCheck

  return (
    <A4Frame className="mx-auto w-full max-w-[210mm]">
      <A4Sheet
        size="fit"
        className="rounded-xl [overflow-wrap:anywhere] print:rounded-none print:shadow-none"
      >
        {/* หัวกระดาษบริษัท */}
        <div className="border-b-2 border-foreground pb-[1em] text-center">
          <h2 className="text-[1.2em] font-bold tracking-tight">{companyName}</h2>
          <p className="mt-[0.25em] text-[0.8em] text-muted-foreground">
            {companyAddress} | โทร. {companyPhone}
          </p>
          <div className="mt-[0.75em] inline-block rounded-full bg-foreground px-[1.25em] py-[0.25em] text-[0.9em] font-semibold text-background">
            {docType}
          </div>
        </div>

        {/* เลขที่อ้างอิงและวันที่ */}
        <div className="mt-[1em] flex flex-wrap items-center justify-between gap-[0.5em] text-[0.8em] text-muted-foreground">
          <span>เลขที่เอกสารอ้างอิง: {appCode}</span>
          <span>วันที่สมัครงาน: {formatThaiDate(applicant.appliedAt)}</span>
        </div>

        {/* เนื้อหาตามประเภทเอกสารทั้ง 12 แบบ */}
        <div className="mt-[1.5em] space-y-[0.75em] text-[0.9em] leading-normal">
        {docType === "ใบสมัครงาน" && (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-[0.5em] rounded-lg border p-[0.8em] sm:grid-cols-2">
              <p>
                <strong>ตำแหน่งที่สมัคร:</strong> {valOrDots(applicant.position)}
              </p>
              <p>
                <strong>เงินเดือนที่ต้องการ:</strong> {applicant.expectedSalary ? `${formatMoney(applicant.expectedSalary)} บาท` : "-"}
              </p>
              <p>
                <strong>ชื่อ-สกุล (ไทย):</strong> {applicant.fullNameTh}
              </p>
              <p>
                <strong>ชื่อ-สกุล (อังกฤษ):</strong> {valOrDots(applicant.fullNameEn)}
              </p>
              <p>
                <strong>เลขประจำตัวประชาชน:</strong> {valOrDots(applicant.nationalId)}
              </p>
              <p>
                <strong>วันเกิด:</strong> {applicant.birthDate ? formatThaiDate(applicant.birthDate) : "-"}
              </p>
              <p>
                <strong>เชื้อชาติ / สัญชาติ / ศาสนา:</strong> {valOrDots(applicant.ethnicity, "-")} /{" "}
                {valOrDots(applicant.nationality, "-")} / {valOrDots(applicant.religion, "-")}
              </p>
              <p>
                <strong>โทรศัพท์มือถือ:</strong> {valOrDots(applicant.mobilePhone)}
              </p>
              <p className="sm:col-span-2">
                <strong>ที่อยู่ปัจจุบัน:</strong> {applicantAddress}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-[0.5em] rounded-lg border p-[0.8em] sm:grid-cols-2">
              <p className="font-semibold sm:col-span-2">ประวัติการศึกษาและการทำงาน</p>
              <p>
                <strong>ระดับการศึกษา:</strong> {valOrDots(applicant.educationLevel, "-")}
              </p>
              <p>
                <strong>สถานศึกษา:</strong> {valOrDots(applicant.lastInstitution, "-")}
              </p>
              <p>
                <strong>สาขาวิชา:</strong> {valOrDots(applicant.major, "-")} (เกรด {valOrDots(applicant.gpa, "-")})
              </p>
              <p>
                <strong>ปีที่สำเร็จการศึกษา:</strong> {valOrDots(applicant.graduationYear, "-")}
              </p>
              <p>
                <strong>สถานที่ทำงานล่าสุด:</strong> {valOrDots(applicant.lastEmployer, "-")}
              </p>
              <p>
                <strong>ตำแหน่งล่าสุด:</strong> {valOrDots(applicant.lastPosition, "-")}
              </p>
            </div>

            <div className="rounded-lg border p-[0.8em]">
              <p>
                <strong>บุคคลติดต่อกรณีฉุกเฉิน:</strong> {valOrDots(applicant.emergencyContactName)} (ความสัมพันธ์:{" "}
                {valOrDots(applicant.emergencyContactRelation, "-")}) โทร. {valOrDots(applicant.emergencyContactPhone)}
              </p>
              <p className="mt-[0.25em]">
                <strong>ประวัติอาชญากรรม:</strong>{" "}
                {applicant.hasCriminalRecord ? `เคยต้องโทษ (${applicant.criminalRecordDetail || "ไม่ระบุ"})` : "ไม่เคยต้องโทษคดีอาญา"}
              </p>
            </div>

            <p className="indent-[2em]">
              ข้าพเจ้าขอรับรองว่าข้อความข้างต้นทั้งหมดเป็นความจริงทุกประการ หากปรากฏภายหลังว่าข้อความใดไม่เป็นความจริง
              ข้าพเจ้ายินยอมให้บริษัทเลิกจ้างได้ทันทีโดยไม่เรียกร้องค่าชดเชยใดๆ
            </p>
            <SignatureBlock
              leftLabel="ผู้สมัครงาน"
              leftName={applicant.fullNameTh}
              rightLabel="เจ้าหน้าที่ฝ่ายบุคคล"
              rightName={docCheck?.checkedByName || "........................................"}
            />
          </>
        )}

        {docType === "สำเนาเอกสารประจำตัวพนักงาน" && (
          <>
            {!docCheck && <MissingRecordBanner message="ผู้สมัครรายนี้ยังไม่มีรายการตรวจเอกสารสมัครงาน" />}
            <p className="indent-8">
              ข้าพเจ้า <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valOrDots(applicant.nationalId)}</strong>{" "}
              ได้นำส่งสำเนาเอกสารประกอบการสมัครงานและบรรจุเป็นพนักงานให้แก่ <strong>{companyName}</strong> ดังรายการต่อไปนี้
            </p>
            <div className="grid min-w-0 grid-cols-1 gap-[0.5em] rounded-lg border p-[1em] sm:grid-cols-2">
              <p>[ {docCheck?.hasPhoto ? "✓" : " "} ] รูปถ่ายหน้าตรง</p>
              <p>[ {docCheck?.hasIdCard ? "✓" : " "} ] สำเนาบัตรประจำตัวประชาชน</p>
              <p>[ {docCheck?.hasHouseRegistration ? "✓" : " "} ] สำเนาทะเบียนบ้าน</p>
              <p>[ {docCheck?.hasEducationCert ? "✓" : " "} ] สำเนาวุฒิการศึกษา</p>
              <p>
                [ {docCheck?.hasCarLicense ? "✓" : " "} ] สำเนาใบขับขี่รถยนต์{" "}
                {docCheck?.carLicenseType ? `(${docCheck.carLicenseType})` : ""}
              </p>
              <p>[ {docCheck?.hasMotorcycleLicense ? "✓" : " "} ] สำเนาใบขับขี่รถจักรยานยนต์</p>
              <p>[ {docCheck?.hasMilitaryDoc ? "✓" : " "} ] สำเนาเอกสารทางทหาร (สด.8 / สด.43)</p>
              <p>[ {docCheck?.hasDisabilityCard ? "✓" : " "} ] สำเนาบัตรประจำตัวคนพิการ</p>
              <p className="sm:col-span-2">[ {docCheck?.hasOther ? "✓" : " "} ] เอกสารอื่นๆ</p>
              {docCheck?.comment && (
                <p className="text-[0.75em] text-muted-foreground sm:col-span-2">
                  <strong>หมายเหตุการตรวจ:</strong> {docCheck.comment}
                </p>
              )}
            </div>
            <p className="indent-8">
              ข้าพเจ้าขอรับรองสำเนาถูกต้องของเอกสารทุกฉบับที่แนบมาพร้อมนี้ และยินยอมให้บริษัทเก็บรวบรวมเพื่อใช้ในกิจการด้านบริหารงานบุคคล
            </p>
            <SignatureBlock
              leftLabel="เจ้าของเอกสาร"
              leftName={applicant.fullNameTh}
              rightLabel="ผู้ตรวจรับเอกสาร"
              rightName={docCheck?.checkedByName || "........................................"}
            />
          </>
        )}

        {docType === "หนังสือให้ความยินยอม" && (
          <>
            <p className="indent-8">
              เขียนที่ <strong>{companyName}</strong> วันที่ {formatThaiDateLong(applicant.appliedAt)}
            </p>
            <p className="indent-8">
              ข้าพเจ้า <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valOrDots(applicant.nationalId)}</strong>{" "}
              อยู่บ้านเลขที่ {applicantAddress} โทรศัพท์ {valOrDots(applicant.mobilePhone)}
            </p>
            <p className="indent-8">
              ขอแสดงเจตนาให้ความยินยอมแก่ <strong>{companyName}</strong> ในการตรวจสอบประวัติอาชญากรรม ตรวจสุขภาพ
              พิสูจน์ตัวตน และติดต่อสอบถามข้อมูลอ้างอิงจากบุคคลหรือหน่วยงานที่เกี่ยวข้อง เพื่อประกอบการพิจารณารับเข้าทำงานและระหว่างการปฏิบัติงาน
            </p>
            <div className="rounded-lg border p-3">
              <p>1. ความยินยอมเพื่อตรวจสอบประวัติอาชญากรรม: <strong>{valOrDots(applicant.consentCriminalCheck, "ยินยอม")}</strong></p>
              <p>2. ความยินยอมเพื่อตรวจสุขภาพ: <strong>{valOrDots(applicant.consentHealthCheck, "ยินยอม")}</strong></p>
              <p>3. ความยินยอมเพื่อพิสูจน์ตัวตน: <strong>{valOrDots(applicant.consentIdentity, "ยินยอม")}</strong></p>
              <p>4. ความยินยอมเพื่ออ้างอิงประวัติการทำงาน: <strong>{valOrDots(applicant.consentReference, "ยินยอม")}</strong></p>
            </div>
            <SignatureBlock
              leftLabel="ผู้ให้ความยินยอม"
              leftName={applicant.fullNameTh}
              rightLabel="พยาน / เจ้าหน้าที่ HR"
              rightName={docCheck?.checkedByName || "........................................"}
            />
          </>
        )}

        {docType === "หนังสือแสดงความยินยอม" && (
          <>
            <p className="indent-8">
              ข้าพเจ้า <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valOrDots(applicant.nationalId)}</strong>{" "}
              ตำแหน่ง <strong>{valOrDots(interview?.position || applicant.position)}</strong>
            </p>
            <p className="indent-8">
              ขอแสดงความยินยอมให้ <strong>{companyName}</strong> ดำเนินการหักเงินค่าจ้างหรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากบริษัท
              เพื่อชำระเงินสมทบกองทุนประกันสังคม ภาษีเงินได้หัก ณ ที่จ่าย ค่าเบี้ยประกันอุบัติเหตุกลุ่ม ค่าชุดยูนิฟอร์ม หรือค่าเสียหายที่เกิดจากการปฏิบัติงานโดยประมาทเลินเล่อของข้าพเจ้าตามที่กฎหมายแรงงานอนุญาต
            </p>
            <p className="indent-8">
              ทั้งนี้ ข้าพเจ้าได้อ่านและเข้าใจข้อความในหนังสือแสดงความยินยอมนี้โดยตลอดแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
            </p>
            <SignatureBlock
              leftLabel="ผู้แสดงความยินยอม"
              leftName={applicant.fullNameTh}
              rightLabel="ผู้มีอำนาจลงนาม"
              rightName={companyName}
            />
          </>
        )}

        {docType === "หนังสือแจ้งการเก็บข้อมูลส่วนบุคคล (PDPA)" && (
          <>
            <p className="indent-8">
              <strong>{companyName}</strong> (&ldquo;บริษัท&rdquo;) ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
              พ.ศ. 2562 (PDPA) จึงขอแจ้งรายละเอียดการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน ดังนี้
            </p>
            <div className="space-y-1.5 rounded-lg border p-3">
              <p>
                <strong>1. เจ้าของข้อมูลส่วนบุคคล:</strong> {applicant.fullNameTh} (เลขบัตรประชาชน {valOrDots(applicant.nationalId)})
              </p>
              <p>
                <strong>2. ข้อมูลที่เก็บรวบรวม:</strong> ข้อมูลระบุตัวตน ที่อยู่ เบอร์ติดต่อ วุฒิการศึกษา บัญชีธนาคาร ({valOrDots(interview?.bankName, "-")}{" "}
                เลขที่ {valOrDots(interview?.bankAccountNo, "-")}) ข้อมูลสุขภาพ และประวัติอาชญากรรม
              </p>
              <p>
                <strong>3. วัตถุประสงค์:</strong> เพื่อการสรรหาบุคลากร การจัดทำสัญญาจ้าง การจ่ายค่าจ้างและสวัสดิการ การยื่นประกันสังคม และส่งตัวปฏิบัติงานให้หน่วยงานลูกค้า
              </p>
              <p>
                <strong>4. ระยะเวลาจัดเก็บ:</strong> ตลอดระยะเวลาการเป็นพนักงาน และจัดเก็บต่อเนื่องตามระยะเวลาที่กฎหมายแรงงานและประมวลรัษฎากรกำหนด
              </p>
            </div>
            <p className="indent-8">
              ข้าพเจ้าได้รับทราบรายละเอียดตามหนังสือแจ้งการเก็บข้อมูลส่วนบุคคลฉบับนี้เรียบร้อยแล้ว
            </p>
            <SignatureBlock
              leftLabel="ผู้รับทราบ / เจ้าของข้อมูล"
              leftName={applicant.fullNameTh}
              rightLabel="เจ้าหน้าที่คุ้มครองข้อมูล / HR"
              rightName={interview?.interviewerName || "........................................"}
            />
          </>
        )}

        {docType === "สัญญาจ้างงาน" && (
          <>
            {!interview?.employmentContract && (
              <MissingRecordBanner message="ยังไม่มีบันทึกวันที่ทำสัญญาจ้างงานในระบบ" />
            )}
            <p className="indent-8">
              สัญญาฉบับนี้ทำขึ้น ณ <strong>{companyName}</strong> เมื่อวันที่{" "}
              <strong>{dateLongOrDots(interview?.employmentContract?.contractDate || interview?.startDate)}</strong> ระหว่าง{" "}
              <strong>{companyName}</strong> ซึ่งต่อไปในสัญญานี้เรียกว่า &ldquo;นายจ้าง&rdquo; ฝ่ายหนึ่ง กับ{" "}
              <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valOrDots(applicant.nationalId)}</strong> อยู่บ้านเลขที่{" "}
              {applicantAddress} ซึ่งต่อไปในสัญญานี้เรียกว่า &ldquo;ลูกจ้าง&rdquo; อีกฝ่ายหนึ่ง
            </p>
            <p className="indent-8">
              <strong>ข้อ 1. การจ้างและตำแหน่งงาน:</strong> นายจ้างตกลงรับลูกจ้างเข้าทำงานในตำแหน่ง{" "}
              <strong>{valOrDots(interview?.position || applicant.position)}</strong> ประจำหน่วยงานลูกค้า{" "}
              <strong>{valOrDots(interview?.customerName)}</strong> ตั้งแต่วันที่{" "}
              <strong>{dateLongOrDots(interview?.startDate)}</strong> เป็นต้นไป
            </p>
            <p className="indent-8">
              <strong>ข้อ 2. อัตราค่าจ้างและการจ่ายค่าจ้าง:</strong> นายจ้างตกลงจ่ายค่าจ้างให้แก่ลูกจ้างในอัตรา{" "}
              <strong>{interview?.wageRate ? `${formatMoney(interview.wageRate)} บาท` : ".................... บาท"}</strong> โดยโอนเข้าบัญชี{" "}
              {valOrDots(interview?.bankName)} เลขที่บัญชี <strong>{valOrDots(interview?.bankAccountNo)}</strong>
            </p>
            <p className="indent-8">
              <strong>ข้อ 3. การทดลองงาน:</strong> ลูกจ้างตกลงทดลองงานเป็นระยะเวลา{" "}
              <strong>{valOrDots(interview?.probationDays, "119")} วัน</strong> ตั้งแต่วันที่{" "}
              {dateLongOrDots(interview?.probationStartDate)} ถึงวันที่ {dateLongOrDots(interview?.probationEndDate)}
            </p>
            <SignatureBlock
              leftLabel="ลูกจ้าง"
              leftName={applicant.fullNameTh}
              rightLabel="นายจ้าง / ผู้มีอำนาจลงนาม"
              rightName={companyName}
            />
          </>
        )}

        {docType === "หนังสือรับเข้าทดลองงาน" && (
          <>
            {!interview && <MissingRecordBanner message="ผู้สมัครรายนี้ยังไม่มีข้อมูลผลการสัมภาษณ์และวันเริ่มทดลองงาน" />}
            <p className="indent-8">
              ตามที่ <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valOrDots(applicant.nationalId)}</strong>{" "}
              ได้เข้ารับการสัมภาษณ์งานกับ <strong>{companyName}</strong> เมื่อวันที่{" "}
              {dateLongOrDots(interview?.interviewedAt)} นั้น
            </p>
            <p className="indent-8">
              บริษัทมีความยินดีแจ้งให้ทราบว่า ท่านผ่านการพิจารณาคัดเลือกเข้าปฏิบัติงานในตำแหน่ง{" "}
              <strong>{valOrDots(interview?.position || applicant.position)}</strong> ประจำหน่วยงาน{" "}
              <strong>{valOrDots(interview?.customerName)}</strong> อัตราค่าจ้าง{" "}
              <strong>{interview?.wageRate ? `${formatMoney(interview.wageRate)} บาท` : ".................... บาท"}</strong>
            </p>
            <p className="indent-8">
              ทั้งนี้ ท่านจะต้องเข้ารับการทดลองปฏิบัติงานเป็นเวลา{" "}
              <strong>{valOrDots(interview?.probationDays, "119")} วัน</strong> เริ่มตั้งแต่วันที่{" "}
              <strong>{dateLongOrDots(interview?.probationStartDate || interview?.startDate)}</strong> ถึงวันที่{" "}
              <strong>{dateLongOrDots(interview?.probationEndDate)}</strong> หากผลการประเมินผ่านเกณฑ์ที่บริษัทกำหนด จึงจะได้รับการบรรจุเป็นพนักงานประจำต่อไป
            </p>
            <SignatureBlock
              leftLabel="ผู้รับทราบเงื่อนไขทดลองงาน"
              leftName={applicant.fullNameTh}
              rightLabel="ผู้จัดการฝ่ายทรัพยากรบุคคล"
              rightName={interview?.interviewerName || companyName}
            />
          </>
        )}

        {docType === "หนังสือมอบอำนาจและตรวจประวัติ" && (
          <>
            {!interview?.backgroundCheck && (
              <MissingRecordBanner message="ยังไม่มีบันทึกข้อมูลหนังสือมอบอำนาจและตรวจประวัติ" />
            )}
            <p className="indent-8">
              เขียนที่ <strong>{companyName}</strong> วันที่{" "}
              <strong>{dateLongOrDots(interview?.backgroundCheck?.documentDate)}</strong>
            </p>
            <p className="indent-8">
              โดยหนังสือฉบับนี้ ข้าพเจ้า <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน{" "}
              <strong>{valOrDots(applicant.nationalId)}</strong> ออกให้ ณ{" "}
              {valOrDots(interview?.backgroundCheck?.grantorIdIssuedBy)} อยู่บ้านเลขที่ {applicantAddress} ขอมอบอำนาจให้{" "}
              <strong>{valOrDots(interview?.backgroundCheck?.granteeName)}</strong> เลขประจำตัวประชาชน{" "}
              <strong>{valOrDots(interview?.backgroundCheck?.granteeNationalId)}</strong> ออกให้ ณ{" "}
              {valOrDots(interview?.backgroundCheck?.granteeIdIssuedBy)} เป็นผู้รับมอบอำนาจกระทำการแทนข้าพเจ้า
            </p>
            <p className="indent-8">
              <strong>เพื่อดำเนินการ:</strong>{" "}
              {valOrDots(
                interview?.backgroundCheck?.purpose,
                "ยื่นคำร้องขอตรวจสอบประวัติอาชญากรรม พิมพ์ลายนิ้วมือ และรับผลการตรวจสอบประวัติจากสำนักงานตำรวจแห่งชาติ",
              )}{" "}
              โดยให้มีผลบังคับใช้ตั้งแต่วันที่ <strong>{dateLongOrDots(interview?.backgroundCheck?.effectiveDate)}</strong> เป็นต้นไป
            </p>
            <SignatureBlock
              leftLabel="ผู้มอบอำนาจ"
              leftName={applicant.fullNameTh}
              rightLabel="ผู้รับมอบอำนาจ"
              rightName={valOrDots(interview?.backgroundCheck?.granteeName, "........................................")}
            />
          </>
        )}

        {docType === "หนังสือส่งตัวเพื่อเข้าสัมภาษณ์" && (
          <>
            {!interview?.interviewReferral && (
              <MissingRecordBanner message="ยังไม่มีบันทึกหนังสือส่งตัวเพื่อเข้าสัมภาษณ์" />
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <p>
                <strong>เลขที่หนังสือ:</strong> {valOrDots(interview?.interviewReferral?.letterNo)}
              </p>
              <p>
                <strong>วันที่:</strong> {dateLongOrDots(interview?.interviewReferral?.documentDate)}
              </p>
            </div>
            <p>
              <strong>เรื่อง:</strong> ขอส่งตัวผู้สมัครงานเพื่อเข้ารับการสัมภาษณ์
            </p>
            <p>
              <strong>เรียน:</strong> {valOrDots(interview?.interviewReferral?.addressedTo || interview?.customerName)}
            </p>
            <p className="indent-8">
              ตามที่หน่วยงานของท่านมีความประสงค์รับสมัครบุคลากรเข้าปฏิบัติงานนั้น <strong>{companyName}</strong>{" "}
              ขอส่งตัว {applicant.fullNameTh} เลขประจำตัวประชาชน{" "}
              {valOrDots(applicant.nationalId)} โทรศัพท์ {valOrDots(applicant.mobilePhone)} เพื่อเข้ารับการสัมภาษณ์ในตำแหน่ง{" "}
              <strong>{valOrDots(interview?.position || applicant.position)}</strong>
            </p>
            <p className="indent-8">จึงเรียนมาเพื่อโปรดพิจารณา และขอขอบพระคุณมา ณ โอกาสนี้</p>
            <SignatureBlock
              leftLabel="ผู้เข้ารับการสัมภาษณ์"
              leftName={applicant.fullNameTh}
              rightLabel="ผู้จัดทำหนังสือ / เจ้าหน้าที่ HR"
              rightName={valOrDots(interview?.interviewReferral?.issuedByName || interview?.interviewerName, "........................................")}
            />
          </>
        )}

        {docType === "หนังสือส่งตัวเพื่อเข้าปฏิบัติงาน" && (
          <>
            {!interview?.assignmentLetter && (
              <MissingRecordBanner message="ยังไม่มีบันทึกหนังสือส่งตัวเพื่อเข้าปฏิบัติงาน" />
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <p>
                <strong>เลขที่หนังสือ:</strong> {valOrDots(interview?.assignmentLetter?.letterNo)}
              </p>
              <p>
                <strong>วันที่:</strong> {dateLongOrDots(interview?.assignmentLetter?.documentDate)}
              </p>
            </div>
            <p>
              <strong>เรื่อง:</strong> ขอส่งตัวพนักงานเพื่อเข้าปฏิบัติงาน
            </p>
            <p>
              <strong>เรียน:</strong> {valOrDots(interview?.assignmentLetter?.addressedTo || interview?.customerName)}
            </p>
            <p className="indent-8">
              <strong>{companyName}</strong> ขอส่งตัวพนักงานชื่อ <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน{" "}
              <strong>{valOrDots(applicant.nationalId)}</strong> เพื่อเข้าปฏิบัติงานในตำแหน่ง{" "}
              <strong>{valOrDots(interview?.position || applicant.position)}</strong> ประจำหน่วยงาน{" "}
              <strong>{valOrDots(interview?.customerName)}</strong> ({valOrDots(interview?.customerJobName, "-")}) เริ่มปฏิบัติงานตั้งแต่วันที่{" "}
              <strong>{dateLongOrDots(interview?.startDate)}</strong> เป็นต้นไป
            </p>
            <p className="indent-8">จึงเรียนมาเพื่อโปรดรับพนักงานเข้าปฏิบัติงานตามรายละเอียดข้างต้น</p>
            <SignatureBlock
              leftLabel="พนักงานผู้เข้าปฏิบัติงาน"
              leftName={applicant.fullNameTh}
              rightLabel="ผู้จัดทำหนังสือ / เจ้าหน้าที่ HR"
              rightName={valOrDots(interview?.assignmentLetter?.issuedByName || interview?.interviewerName, "........................................")}
            />
          </>
        )}

        {docType === "สัญญาค้ำประกันบุคคลเข้าทำงาน" && (
          <>
            {!interview?.guaranteeContract && (
              <MissingRecordBanner message="ยังไม่มีบันทึกข้อมูลสัญญาค้ำประกันบุคคลเข้าทำงาน" />
            )}
            <p className="indent-8">
              ทำที่ <strong>{companyName}</strong> วันที่{" "}
              <strong>{dateLongOrDots(interview?.guaranteeContract?.contractDate)}</strong>
            </p>
            <p className="indent-8">
              ข้าพเจ้า <strong>{valOrDots(interview?.guaranteeContract?.guarantorName)}</strong> อายุ{" "}
              <strong>{valOrDots(interview?.guaranteeContract?.guarantorAge, "......")}</strong> ปี เลขประจำตัวประชาชน{" "}
              <strong>{valOrDots(interview?.guaranteeContract?.guarantorNationalId)}</strong> อยู่บ้านเลขที่{" "}
              {interview?.guaranteeContract ? formatAddress(interview.guaranteeContract) : "...................................................................."}{" "}
              โทรศัพท์ <strong>{valOrDots(interview?.guaranteeContract?.guarantorPhone)}</strong> ซึ่งต่อไปนี้เรียกว่า &ldquo;ผู้ค้ำประกัน&rdquo;
            </p>
            <p className="indent-8">
              ขอทำสัญญาค้ำประกันให้ไว้แก่ <strong>{companyName}</strong> เพื่อค้ำประกันการทำงานของ{" "}
              <strong>{applicant.fullNameTh}</strong> เลขประจำตัวประชาชน <strong>{valOrDots(applicant.nationalId)}</strong>{" "}
              ซึ่งเข้าทำงานในตำแหน่ง <strong>{valOrDots(interview?.position || applicant.position)}</strong> หากผู้ถูกค้ำประกันกระทำการทุจริตหรือก่อให้เกิดความเสียหายแก่นายจ้างหรือลูกค้าของนายจ้าง
              ผู้ค้ำประกันยินยอมรับผิดชดใช้ค่าเสียหายแทนตามขอบเขตที่กฎหมายกำหนด
            </p>
            <SignatureBlock
              leftLabel="ผู้ค้ำประกัน"
              leftName={valOrDots(interview?.guaranteeContract?.guarantorName, "........................................")}
              rightLabel="พยาน / ผู้รับสัญญา"
              rightName={companyName}
            />
          </>
        )}

        {docType === "รายชื่อผู้ประกันตน" && (
          <>
            <p className="indent-8">
              เอกสารประกอบการขึ้นทะเบียนผู้ประกันตน (สปส. 1-03) สำนักงานประกันสังคม ของสถานประกอบการ{" "}
              <strong>{companyName}</strong> เลขประจำตัวผู้เสียภาษี {valOrDots(applicant.defaultCompany?.taxId)}
            </p>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-fixed border-collapse border text-[0.75em]">
                <thead>
                  <tr className="bg-muted">
                    <th className="border px-[0.5em] py-[0.35em] text-center">ลำดับ</th>
                    <th className="border px-[0.5em] py-[0.35em] text-left">เลขบัตรประชาชน</th>
                    <th className="border px-[0.5em] py-[0.35em] text-left">ชื่อ-สกุล ผู้ประกันตน</th>
                    <th className="border px-[0.5em] py-[0.35em] text-left">ตำแหน่ง</th>
                    <th className="border px-[0.5em] py-[0.35em] text-center">วันที่เริ่มงาน</th>
                    <th className="border px-[0.5em] py-[0.35em] text-right">ค่าจ้าง (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-[0.5em] py-[0.35em] text-center">1</td>
                    <td className="border px-[0.5em] py-[0.35em]">{valOrDots(applicant.nationalId, "-")}</td>
                    <td className="border px-[0.5em] py-[0.35em] font-medium">{applicant.fullNameTh}</td>
                    <td className="border px-[0.5em] py-[0.35em]">{valOrDots(interview?.position || applicant.position, "-")}</td>
                    <td className="border px-[0.5em] py-[0.35em] text-center">
                      {interview?.startDate ? formatThaiDate(interview.startDate) : "-"}
                    </td>
                    <td className="border px-[0.5em] py-[0.35em] text-right">{formatMoney(interview?.wageRate ?? applicant.expectedSalary)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <SignatureBlock
              leftLabel="ผู้ประกันตน"
              leftName={applicant.fullNameTh}
              rightLabel="นายจ้าง / ผู้ยื่นแบบ"
              rightName={companyName}
            />
          </>
        )}
        </div>
      </A4Sheet>
    </A4Frame>
  )
}