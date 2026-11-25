"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Briefcase,
  ClipboardList,
  FileText,
  GraduationCap,
  Phone,
  RotateCcw,
  Save,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useTransition } from "react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { toast } from "sonner"
import {
  CheckboxField,
  DateField,
  NumberField,
  RequiredFieldsProvider,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/form/fields"
import { FormSection } from "@/components/form/form-section"
import { SectionTabs, type SectionTab } from "@/components/form/section-tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"
import { createApplicant, updateApplicant } from "./actions"
import {
  CAR_LICENSE_TYPES,
  CONSENT_ITEMS,
  CONSENT_OPTIONS,
  EDUCATION_LEVELS,
  EMERGENCY_RELATIONS,
  ETHNICITIES,
  LANGUAGE_LEVELS,
  LANGUAGES,
  LEAVING_REASONS,
  MARITAL_STATUSES,
  MILITARY_STATUSES,
  NAME_TITLES,
  NATIONALITIES,
  OCCUPATIONS,
  POSITIONS,
  PROVINCES,
  RELIGIONS,
} from "./options"
import { isRequiredField, schemaFor, type ApplicantInput, type SaveMode } from "./schema"

/** แท็บด้านบน (ตามดีไซน์) → หมวด (FormSection id) ที่อยู่ใต้แท็บ */
const TABS = [
  { id: "general", label: "ข้อมูลทั่วไป", icon: UserRound, sections: ["basic", "personal"] },
  { id: "education", label: "ประวัติการศึกษา", icon: GraduationCap, sections: ["education"] },
  { id: "work", label: "ประวัติการทำงาน", icon: Briefcase, sections: ["work"] },
  { id: "contact", label: "การติดต่อ", icon: Phone, sections: ["contact"] },
  { id: "consent", label: "เอกสารและความยินยอม", icon: FileText, sections: ["consent"] },
] as const satisfies readonly SectionTab[]

/*
 * grid ของแต่ละหมวดใช้ container query (@...) ตามความกว้างของกล่อง ไม่ใช่ความกว้างจอ
 * จอใหญ่ = หลายคอลัมน์ตามดีไซน์, กล่องแคบ/มือถือ = 2 หรือ 1 คอลัมน์อัตโนมัติ
 */
const GRID_BASIC = "grid gap-x-3 gap-y-3 @md:grid-cols-2 @2xl:grid-cols-4 @4xl:grid-cols-24"
const GRID_EDUCATION = "grid gap-x-3 gap-y-3 @md:grid-cols-2 @xl:grid-cols-24"
const GRID_WORK = "grid gap-x-3 gap-y-3 @md:grid-cols-2 @2xl:grid-cols-24"
const GRID_CONTACT = "grid gap-x-3 gap-y-3 @md:grid-cols-2 @3xl:grid-cols-3"

/** เลขบัตร: เก็บเป็นตัวเลข 13 หลัก แสดงเป็น 1-2345-67890-12-3 */
function formatNationalId(value: string) {
  const d = value.replace(/\D/g, "")
  return [d.slice(0, 1), d.slice(1, 5), d.slice(5, 10), d.slice(10, 12), d.slice(12, 13)].filter(Boolean).join("-")
}
const parseNationalId = (typed: string) => typed.replace(/\D/g, "").slice(0, 13)

type Props = {
  /** มี applicantId = แก้ไข, ไม่มี = เพิ่มใหม่ */
  applicantId?: number
  /** แสดงปุ่ม "บันทึกร่าง" ไหม (ใบใหม่และใบที่ยังเป็นร่าง = ได้, ใบที่บันทึกใบสมัครแล้ว = ไม่ได้) */
  canSaveDraft?: boolean
  defaultValues: ApplicantInput
}

/** ฟอร์มใบสมัครงาน ใช้ทั้งเพิ่มและแก้ไข */
export function ApplicantForm({ applicantId, canSaveDraft = true, defaultValues }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // ปุ่มไหนถูกกด: บันทึกร่าง = ตรวจหลวม, บันทึกใบสมัคร = ตรวจครบ
  const modeRef = useRef<SaveMode>("submit")
  const form = useForm<ApplicantInput>({
    resolver: (values, context, options) => zodResolver(schemaFor(modeRef.current))(values, context, options),
    defaultValues,
  })
  const { control } = form

  const [isPregnant, hasCriminalRecord, hasCarLicense, idCardIssuedAt, licenseIssuedAt] = useWatch({
    control,
    name: ["isPregnant", "hasCriminalRecord", "hasCarLicense", "idCardIssuedAt", "licenseIssuedAt"],
  })

  // ช่องที่ตรวจโดยดูช่องอื่น: ถ้าเคยกดบันทึกแล้ว ให้ตรวจใหม่ทันทีเมื่อช่องที่เกี่ยวข้องเปลี่ยน
  const { isSubmitted } = form.formState
  useEffect(() => {
    if (isSubmitted) void form.trigger(["pregnancyMonths", "criminalRecordDetail", "idCardExpiresAt", "licenseExpiresAt"])
  }, [form, isSubmitted, isPregnant, hasCriminalRecord, idCardIssuedAt, licenseIssuedAt])

  function save(mode: SaveMode) {
    modeRef.current = mode
    void form.handleSubmit((values) => onValid(values, mode), onInvalid)()
  }

  function onValid(values: ApplicantInput, mode: SaveMode) {
    startTransition(async () => {
      const result = applicantId
        ? await updateApplicant(applicantId, values, mode)
        : await createApplicant(values, mode)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof ApplicantInput, { message: messages[0] }, { shouldFocus: true })
        }
        return
      }
      toast.success(result.message)
      if (mode === "submit") {
        router.push("/applicants")
        return
      }
      // บันทึกร่าง: อยู่หน้าเดิม (ใบสมัครใหม่ย้ายไปหน้าแก้ไขของเลขที่ที่ได้)
      form.reset(values)
      if (!applicantId && result.data && "id" in result.data) router.replace(`/applicants/${result.data.id}/edit`)
    })
  }

  function onInvalid() {
    toast.error("กรุณาตรวจสอบช่องที่มีข้อความสีแดง")
  }

  return (
    <RequiredFieldsProvider isRequired={isRequiredField}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save("submit")
        }}
        noValidate
        className="space-y-4 [&_input]:scroll-mt-44 [&_select]:scroll-mt-44 [&_textarea]:scroll-mt-44"
      >
        <SectionTabs tabs={TABS} label="หมวดของใบสมัคร" />

        {/* ตำแหน่งที่สมัครและข้อมูลพื้นฐาน */}
        <FormSection id="basic" icon={ClipboardList} title="ตำแหน่งที่สมัครและข้อมูลพื้นฐาน">
          <div className={GRID_BASIC}>
            <Field className="min-w-0 gap-1.5 @4xl:col-span-6">
              <FieldLabel htmlFor="applicantNo" className="text-[0.8rem] font-semibold">
                เลขที่ (อ้างอิง)
              </FieldLabel>
              <Input id="applicantNo" value={applicantId ?? "อัตโนมัติ"} readOnly disabled />
            </Field>
            <DateField control={control} name="appliedAt" label="วันที่สมัคร" className="@4xl:col-span-6" />
            <SelectField
              control={control}
              name="position"
              label="ตำแหน่งงาน"
              options={POSITIONS}
              placeholder="-- เลือกตำแหน่งงาน --"
              className="@4xl:col-span-6"
            />
            <NumberField
              control={control}
              name="expectedSalary"
              label="เงินเดือนที่ต้องการ"
              decimal
              suffix="บาท"
              className="@4xl:col-span-6"
            />

            <SelectField
              control={control}
              name="titleTh"
              label="คำนำหน้าชื่อ"
              options={NAME_TITLES.map((t) => t.th)}
              className="@4xl:col-span-4"
            />
            <TextField control={control} name="firstNameTh" label="ชื่อ (ไทย)" placeholder="กรอกชื่อ" className="@4xl:col-span-5" />
            <TextField control={control} name="lastNameTh" label="นามสกุล (ไทย)" placeholder="กรอกนามสกุล" className="@4xl:col-span-5" />
            <TextField
              control={control}
              name="firstNameEn"
              label="ชื่อ (อังกฤษ)"
              placeholder="Enter first name"
              autoComplete="off"
              className="@4xl:col-span-5"
            />
            <TextField
              control={control}
              name="lastNameEn"
              label="นามสกุล (อังกฤษ)"
              placeholder="Enter last name"
              autoComplete="off"
              className="@4xl:col-span-5"
            />

            <TextField
              control={control}
              name="nationalId"
              label="เลขบัตรประชาชน"
              placeholder="X-XXXX-XXXXX-XX-X"
              inputMode="numeric"
              autoComplete="off"
              maxLength={17}
              format={formatNationalId}
              parse={parseNationalId}
              className="@4xl:col-span-6"
            />
            <DateField control={control} name="idCardIssuedAt" label="วันที่ออกบัตร" className="@4xl:col-span-5" />
            <DateField control={control} name="idCardExpiresAt" label="วันที่บัตรหมดอายุ" className="@4xl:col-span-5" />
            <TextField control={control} name="addressNo" label="เลขที่" placeholder="กรอกเลขที่" className="@4xl:col-span-4" />
            <TextField control={control} name="moo" label="หมู่ที่" placeholder="กรอกหมู่ที่" className="@4xl:col-span-4" />

            <TextField control={control} name="road" label="ถนน" placeholder="กรอกชื่อถนน" className="@4xl:col-span-6" />
            <TextField
              control={control}
              name="subdistrict"
              label="ตำบล/แขวง"
              placeholder="กรอกตำบล/แขวง"
              className="@4xl:col-span-6"
            />
            <TextField control={control} name="district" label="อำเภอ/เขต" placeholder="กรอกอำเภอ/เขต" className="@4xl:col-span-6" />
            <SelectField
              control={control}
              name="province"
              label="จังหวัด"
              options={PROVINCES}
              placeholder="-- เลือกจังหวัด --"
              className="@4xl:col-span-6"
            />

            <TextField
              control={control}
              name="homePhone"
              label="โทรศัพท์บ้าน"
              placeholder="กรอกเบอร์โทร"
              type="tel"
              inputMode="tel"
              className="@4xl:col-span-3"
            />
            <TextField
              control={control}
              name="mobilePhone"
              label="โทรศัพท์มือถือ"
              placeholder="กรอกเบอร์มือถือ"
              icon={Phone}
              type="tel"
              inputMode="tel"
              className="@4xl:col-span-4"
            />
            <DateField control={control} name="birthDate" label="วันเกิด" className="@4xl:col-span-3" />
            <NumberField control={control} name="weightKg" label="น้ำหนัก (กก.)" decimal className="@4xl:col-span-2" />
            <NumberField control={control} name="heightCm" label="ส่วนสูง (ซม.)" decimal className="@4xl:col-span-2" />
            <SelectField
              control={control}
              name="ethnicity"
              label="เชื้อชาติ"
              options={ETHNICITIES}
              placeholder="-- เลือกเชื้อชาติ --"
              className="@4xl:col-span-3"
            />
            <SelectField
              control={control}
              name="nationality"
              label="สัญชาติ"
              options={NATIONALITIES}
              placeholder="-- เลือกสัญชาติ --"
              className="@4xl:col-span-4"
            />
            <SelectField
              control={control}
              name="religion"
              label="ศาสนา"
              options={RELIGIONS}
              placeholder="-- เลือกศาสนา --"
              className="@4xl:col-span-3"
            />
          </div>
        </FormSection>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* ข้อมูลส่วนตัว (label อยู่ซ้ายช่อง ตามดีไซน์) */}
          <FormSection id="personal" icon={UsersRound} title="ข้อมูลส่วนตัว" contentClassName="[--field-label-w:5.5rem]">
            <div className="grid gap-x-6 gap-y-3 @md:grid-cols-2">
              <div className="space-y-3">
                <TextField control={control} name="fatherName" label="ชื่อบิดา" placeholder="กรอกชื่อบิดา" layout="horizontal" />
                <TextField control={control} name="motherName" label="ชื่อมารดา" placeholder="กรอกชื่อมารดา" layout="horizontal" />
                <SelectField
                  control={control}
                  name="fatherOccupation"
                  label="บิดาอาชีพ"
                  options={OCCUPATIONS}
                  placeholder="-- เลือกอาชีพ --"
                  layout="horizontal"
                />
                <SelectField
                  control={control}
                  name="motherOccupation"
                  label="มารดาอาชีพ"
                  options={OCCUPATIONS}
                  placeholder="-- เลือกอาชีพ --"
                  layout="horizontal"
                />
                <TextField control={control} name="spouseName" label="ชื่อคู่สมรส" placeholder="กรอกชื่อคู่สมรส" layout="horizontal" />
                <TextField
                  control={control}
                  name="spousePhone"
                  label="โทรคู่สมรส"
                  placeholder="กรอกเบอร์โทร"
                  type="tel"
                  inputMode="tel"
                  layout="horizontal"
                />
              </div>
              <div className="space-y-3">
                <NumberField control={control} name="siblingsCount" label="จำนวนพี่น้อง" stepper layout="horizontal" />
                <NumberField control={control} name="birthOrder" label="เป็นคนที่" stepper layout="horizontal" />
                <SelectField
                  control={control}
                  name="maritalStatus"
                  label="สถานภาพ"
                  options={MARITAL_STATUSES}
                  placeholder="-- เลือกสถานภาพ --"
                  layout="horizontal"
                />
                <NumberField control={control} name="childrenCount" label="จำนวนบุตร" stepper layout="horizontal" />
                <SelectField
                  control={control}
                  name="militaryStatus"
                  label="ราชการทหาร"
                  options={MILITARY_STATUSES}
                  layout="horizontal"
                />
                <div className="flex items-start gap-3">
                  <CheckboxField control={control} name="isPregnant" label="ตั้งครรภ์" className="shrink-0" />
                  <NumberField
                    control={control}
                    name="pregnancyMonths"
                    label="(เดือน)"
                    stepper
                    disabled={!isPregnant}
                    required={isPregnant}
                    layout="horizontal"
                    className="flex-1 [--field-label-w:3.5rem]"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 border-t pt-3 @lg:grid-cols-[auto_minmax(0,1fr)] @lg:items-start">
              <CheckboxField control={control} name="hasCriminalRecord" label="เคยต้องโทษคดี" className="@lg:mt-1.5" />
              <TextareaField
                control={control}
                name="criminalRecordDetail"
                label="ระบุคดี"
                rows={1}
                placeholder="ถ้าเคยต้องโทษ ให้ระบุคดี"
                disabled={!hasCriminalRecord}
                required={hasCriminalRecord}
                layout="horizontal"
                className="[--field-label-w:4rem]"
              />
            </div>
          </FormSection>

          {/* ประวัติการศึกษา + ความสามารถ */}
          <FormSection id="education" icon={GraduationCap} title="ประวัติการศึกษา">
            <div className={GRID_EDUCATION}>
              <SelectField
                control={control}
                name="educationLevel"
                label="ระดับการศึกษา"
                options={EDUCATION_LEVELS}
                placeholder="-- เลือกระดับการศึกษา --"
                className="@xl:col-span-6"
              />
              <TextField
                control={control}
                name="lastInstitution"
                label="ชื่อสถานศึกษา (สุดท้าย)"
                placeholder="กรอกชื่อสถานศึกษา"
                className="@xl:col-span-8"
              />
              <SelectField
                control={control}
                name="institutionProvince"
                label="จังหวัด"
                options={PROVINCES}
                placeholder="-- เลือกจังหวัด --"
                className="@xl:col-span-6"
              />
              <NumberField control={control} name="gpa" label="เกรดเฉลี่ย" decimal className="@xl:col-span-4" />

              <TextField control={control} name="major" label="สาขาวิชา" placeholder="กรอกสาขาวิชา" className="@xl:col-span-4" />
              <TextField
                control={control}
                name="graduationYear"
                label="ปีที่สำเร็จ"
                placeholder="พ.ศ."
                inputMode="numeric"
                maxLength={4}
                className="@xl:col-span-3"
              />
              <SelectField
                control={control}
                name="languageSkills"
                label="ความสามารถด้านภาษา"
                options={LANGUAGES}
                placeholder="-- เลือกภาษา --"
                className="@xl:col-span-5"
              />
              <SelectField control={control} name="speakLevel" label="พูด" options={LANGUAGE_LEVELS} placeholder="-- ระดับ --" className="@xl:col-span-4" />
              <SelectField control={control} name="readLevel" label="อ่าน" options={LANGUAGE_LEVELS} placeholder="-- ระดับ --" className="@xl:col-span-4" />
              <SelectField control={control} name="writeLevel" label="เขียน" options={LANGUAGE_LEVELS} placeholder="-- ระดับ --" className="@xl:col-span-4" />
            </div>

            <h3 className="mt-4 mb-2 border-t pt-3 text-sm font-bold text-brand-green-dark">ความสามารถพิเศษ</h3>
            <div className={GRID_EDUCATION}>
              <NumberField control={control} name="thaiTypingWpm" label="พิมพ์ไทย (คำ/นาที)" className="@xl:col-span-5" />
              <NumberField control={control} name="englishTypingWpm" label="พิมพ์ ENG (คำ/นาที)" className="@xl:col-span-5" />
              <CheckboxGroup label="คอมพิวเตอร์" className="@xl:col-span-7">
                <CheckboxField control={control} name="canUseWord" label="Word" />
                <CheckboxField control={control} name="canUseExcel" label="Excel" />
                <CheckboxField control={control} name="canUsePowerpoint" label="PowerPoint" />
              </CheckboxGroup>
              <TextField
                control={control}
                name="otherComputerSkills"
                label="คอมพิวเตอร์อื่นๆ"
                placeholder="ระบุโปรแกรมอื่น"
                className="@xl:col-span-7"
              />

              <CheckboxGroup label="ใบขับขี่" className="@xl:col-span-8">
                <CheckboxField control={control} name="hasMotorcycleLicense" label="รถจักรยานยนต์" />
                <CheckboxField control={control} name="hasCarLicense" label="รถยนต์" />
              </CheckboxGroup>
              <SelectField
                control={control}
                name="carLicenseType"
                label="ชนิดใบขับขี่รถยนต์"
                options={CAR_LICENSE_TYPES}
                disabled={!hasCarLicense}
                className="@xl:col-span-6"
              />
              <DateField control={control} name="licenseIssuedAt" label="วันที่ออกใบขับขี่" className="@xl:col-span-5" />
              <DateField control={control} name="licenseExpiresAt" label="วันที่ใบขับขี่หมดอายุ" className="@xl:col-span-5" />
            </div>
          </FormSection>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* ประวัติการทำงาน (ล่าสุด) */}
          <FormSection id="work" icon={Briefcase} title="ประวัติการทำงาน (ล่าสุด)">
            <div className={GRID_WORK}>
              <TextField
                control={control}
                name="lastEmployer"
                label="ชื่อหน่วยงานที่ทำงานล่าสุด"
                placeholder="กรอกชื่อหน่วยงาน"
                className="@2xl:col-span-6"
              />
              <TextField
                control={control}
                name="lastPosition"
                label="ตำแหน่งงานล่าสุด"
                placeholder="กรอกตำแหน่งงาน"
                className="@2xl:col-span-5"
              />
              <NumberField control={control} name="lastSalary" label="เงินเดือน (บาท)" decimal className="@2xl:col-span-4" />
              <TextField
                control={control}
                name="lastWorkDuration"
                label="ระยะเวลาทำงาน (ปี)"
                placeholder="เช่น 1 ปี 6 เดือน"
                className="@2xl:col-span-5"
              />
              <SelectField
                control={control}
                name="leavingReason"
                label="สาเหตุที่ออก"
                options={LEAVING_REASONS}
                placeholder="-- เลือกสาเหตุ --"
                className="@2xl:col-span-4"
              />
            </div>
          </FormSection>

          {/* การติดต่อฉุกเฉิน + ที่พัก + ทราบข่าวจาก */}
          <FormSection id="contact" icon={Phone} title="การติดต่อฉุกเฉิน">
            <div className={GRID_CONTACT}>
              <SelectField
                control={control}
                name="emergencyContactRelation"
                label="ความสัมพันธ์"
                options={EMERGENCY_RELATIONS}
                placeholder="-- เลือกความสัมพันธ์ --"
              />
              <TextField
                control={control}
                name="emergencyContactName"
                label="ผู้ติดต่อฉุกเฉิน"
                placeholder="กรอกชื่อ-นามสกุล"
              />
              <TextField
                control={control}
                name="emergencyContactPhone"
                label="โทรศัพท์"
                placeholder="กรอกเบอร์โทรศัพท์"
                icon={Phone}
                type="tel"
                inputMode="tel"
              />
              <TextField control={control} name="livingWith" label="ปัจจุบันพักอยู่กับ" placeholder="เช่น บิดามารดา" />
              <TextField
                control={control}
                name="residencePhone"
                label="โทรศัพท์ที่พัก"
                placeholder="กรอกเบอร์โทร"
                type="tel"
                inputMode="tel"
              />
              <TextField control={control} name="jobSource" label="ทราบข่าวรับสมัครจาก" placeholder="เช่น Facebook" />
            </div>
          </FormSection>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-end">
          {/* เอกสารและความยินยอม PDPA */}
          <FormSection id="consent" icon={FileText} title="เอกสารและความยินยอม">
            <ol className="space-y-2.5">
              {CONSENT_ITEMS.map((item, i) => (
                <ConsentRow key={item.field} control={control} name={item.field} index={i + 1} text={item.text} />
              ))}
            </ol>
          </FormSection>

          {/* ปุ่มท้ายฟอร์ม */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Link href="/applicants" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
              <X />
              ยกเลิก
            </Link>
            <ResetButton onConfirm={() => form.reset()} disabled={pending} />
            {canSaveDraft && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={pending}
                onClick={() => save("draft")}
                className="h-10 border-primary px-4 text-primary hover:bg-secondary hover:text-primary"
              >
                <Save />
                บันทึกร่าง
              </Button>
            )}
            <Button type="submit" size="lg" disabled={pending} className="h-10 px-4">
              <Save />
              {pending ? "กำลังบันทึก..." : "บันทึกใบสมัคร"}
            </Button>
          </div>
        </div>
      </form>
    </RequiredFieldsProvider>
  )
}

/** กลุ่มช่องติ๊กที่มีหัวข้อเดียว (เช่น คอมพิวเตอร์: Word Excel PowerPoint) */
function CheckboxGroup({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn("min-w-0 space-y-1.5", className)}>
      <p className="text-[0.8rem] leading-snug font-semibold">{label}</p>
      <div className="flex min-h-8 flex-wrap items-center gap-x-5 gap-y-1">{children}</div>
    </div>
  )
}

/**
 * ความยินยอม 1 ข้อ: ติ๊ก = ยินยอม, เอาติ๊กออก = ยังไม่ระบุ
 * หรือเลือกจากรายการ (ยินยอม / ไม่ยินยอม) ทั้งสองแบบเก็บในช่องเดียวกัน
 */
function ConsentRow({
  control,
  name,
  index,
  text,
}: {
  control: Control<ApplicantInput>
  name: (typeof CONSENT_ITEMS)[number]["field"]
  index: number
  text: string
}) {
  const selectId = `${name}-select`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <li className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 @2xl:grid-cols-[auto_minmax(0,1fr)_11rem] @2xl:items-center">
          <Checkbox
            id={name}
            checked={field.value === "ยินยอม"}
            onCheckedChange={(checked) => field.onChange(checked ? "ยินยอม" : "")}
            aria-label={`ยินยอมข้อ ${index}`}
            className="mt-0.5 @2xl:mt-0"
          />
          <label htmlFor={name} className="text-sm leading-relaxed">
            <span className="font-semibold">{index}. </span>
            {text}
          </label>
          <div className="col-start-2 @2xl:col-start-3">
            <NativeSelect
              id={selectId}
              name={field.name}
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              aria-label={`ความยินยอมข้อ ${index}`}
              aria-invalid={fieldState.invalid}
              className={cn("w-full", field.value === "" && "[&_select]:text-muted-foreground")}
            >
              <NativeSelectOption value="">-- เลือก --</NativeSelectOption>
              {field.value !== "" && !(CONSENT_OPTIONS as readonly string[]).includes(field.value) && (
                <NativeSelectOption value={field.value}>{field.value}</NativeSelectOption>
              )}
              {CONSENT_OPTIONS.map((o) => (
                <NativeSelectOption key={o} value={o}>
                  {o}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[fieldState.error]} className="text-xs" />
          </div>
        </li>
      )}
    />
  )
}

/** ปุ่มล้างข้อมูล (ถามยืนยันก่อน) กลับไปเป็นค่าตอนเปิดหน้า/บันทึกร่างล่าสุด */
function ResetButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            size="lg"
            disabled={disabled}
            className="h-10 bg-brand-orange px-4 text-primary-foreground hover:bg-brand-orange-dark"
          />
        }
      >
        <RotateCcw />
        ล้างข้อมูล
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ล้างข้อมูล</AlertDialogTitle>
          <AlertDialogDescription>
            ข้อมูลที่กรอกแต่ยังไม่ได้บันทึกจะกลับเป็นค่าเดิมทั้งหมด ต้องการล้างข้อมูลใช่ไหม
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            ล้างข้อมูล
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
