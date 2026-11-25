"use client"

import { CalendarDays, type LucideIcon } from "lucide-react"
import { createContext, use, useRef, useState } from "react"
import { Controller, type Control, type FieldPathByValue, type FieldValues } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/*
 * ช่องกรอกข้อมูลที่ใช้ซ้ำได้ทุกฟอร์ม (ผูกกับ react-hook-form ผ่าน control + name)
 *
 * ตัวอย่าง:
 *   <TextField control={form.control} name="firstNameTh" label="ชื่อ (ไทย)" placeholder="กรอกชื่อ" />
 *   <DateField control={form.control} name="birthDate" label="วันเกิด" />
 *   <TextField ... layout="horizontal" />   ← label อยู่ซ้ายช่อง (จอเล็กจะเรียงบน-ล่าง)
 *
 * - ค่าของ TextField / NumberField / DateField / SelectField / TextareaField เป็น string
 *   (ช่องว่าง = "") ให้แปลงเป็นตัวเลข/วันที่/null ตอนบันทึกใน Server Action
 * - ค่าของ CheckboxField เป็น boolean
 * - name ถูกตรวจ type: ใส่ชื่อช่องที่ไม่ใช่ string/boolean จะ error ตอน typecheck
 * - เครื่องหมาย * : ใส่ required เอง หรือครอบฟอร์มด้วย <RequiredFieldsProvider isRequired={...}>
 */

// ---------------------------------------------------------------------------
// ช่องบังคับ (ให้ฟอร์มบอกครั้งเดียวว่าช่องไหนบังคับ ไม่ต้องใส่ required ทีละช่อง)
// ---------------------------------------------------------------------------

const RequiredFieldsContext = createContext<(name: string) => boolean>(() => false)

export function RequiredFieldsProvider({
  isRequired,
  children,
}: {
  isRequired: (name: string) => boolean
  children: React.ReactNode
}) {
  return <RequiredFieldsContext value={isRequired}>{children}</RequiredFieldsContext>
}

// ---------------------------------------------------------------------------
// โครงของช่อง: label + ช่องกรอก + คำอธิบาย + ข้อความ error
// ---------------------------------------------------------------------------

export type FieldLayout = "vertical" | "horizontal"

type BaseProps<T extends FieldValues, V> = {
  control: Control<T>
  name: FieldPathByValue<T, V>
  label: string
  description?: React.ReactNode
  /** ไม่ใส่ = ดูจาก RequiredFieldsProvider */
  required?: boolean
  disabled?: boolean
  /** vertical = label อยู่บน (ค่าเริ่มต้น), horizontal = label อยู่ซ้าย */
  layout?: FieldLayout
  /** class ของกล่อง Field (เช่น col-span-2) */
  className?: string
}

function FieldShell({
  name,
  label,
  description,
  required,
  layout = "vertical",
  invalid,
  error,
  className,
  children,
}: {
  name: string
  label: string
  description?: React.ReactNode
  required?: boolean
  layout?: FieldLayout
  invalid: boolean
  error?: { message?: string }
  className?: string
  children: React.ReactNode
}) {
  const isRequired = use(RequiredFieldsContext)
  const showRequired = required ?? isRequired(name)
  const horizontal = layout === "horizontal"
  return (
    <Field
      data-invalid={invalid}
      className={cn(
        "min-w-0 gap-1.5",
        // ความกว้าง label ปรับได้ด้วย [--field-label-w:6rem] ที่กล่องแม่
        horizontal &&
          "sm:grid sm:grid-cols-[var(--field-label-w,7.5rem)_minmax(0,1fr)] sm:items-center sm:gap-x-3 sm:gap-y-1",
        className,
      )}
    >
      {/* label บรรทัดเดียว (ยาวเกินแสดง … ชี้เมาส์ดูเต็ม) ช่องในแถวเดียวกันจะได้ตรงกัน */}
      <FieldLabel htmlFor={name} title={label} className="max-w-full min-w-0 gap-0.5 text-[0.8rem] font-semibold">
        <span className="truncate">{label}</span>
        {showRequired && <span className="shrink-0 text-destructive">*</span>}
      </FieldLabel>
      {children}
      {description && <FieldDescription className={cn("text-xs", horizontal && "sm:col-start-2")}>{description}</FieldDescription>}
      <FieldError errors={[error]} className={cn("text-xs", horizontal && "sm:col-start-2")} />
    </Field>
  )
}

type InputExtraProps = Omit<
  React.ComponentProps<typeof Input>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "disabled" | "className" | "type"
>

// ---------------------------------------------------------------------------
// ช่องข้อความ
// ---------------------------------------------------------------------------

/** ช่องกรอกข้อความ 1 บรรทัด */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  layout,
  className,
  type = "text",
  icon: Icon,
  suffix,
  format,
  parse,
  inputClassName,
  ...inputProps
}: BaseProps<T, string> &
  InputExtraProps & {
    type?: "text" | "email" | "tel" | "number"
    /** ไอคอนด้านซ้ายในช่อง เช่น Phone */
    icon?: LucideIcon
    /** ข้อความด้านขวาในช่อง เช่น "บาท" */
    suffix?: string
    /** แปลงค่าที่เก็บ → ค่าที่แสดง (เช่น ใส่ขีดในเลขบัตร) */
    format?: (value: string) => string
    /** แปลงค่าที่พิมพ์ → ค่าที่เก็บ (เช่น ตัดขีดออก) */
    parse?: (typed: string) => string
    inputClassName?: string
  }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value: string = field.value ?? ""
        return (
          <FieldShell
            name={name}
            label={label}
            description={description}
            required={required}
            layout={layout}
            invalid={fieldState.invalid}
            error={fieldState.error}
            className={className}
          >
            <div className="relative">
              {Icon && (
                <Icon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                {...inputProps}
                id={name}
                type={type}
                name={field.name}
                ref={field.ref}
                value={format ? format(value) : value}
                onChange={(e) => field.onChange(parse ? parse(e.target.value) : e.target.value)}
                onBlur={field.onBlur}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
                className={cn(Icon && "pl-8", suffix && "pr-11", inputClassName)}
              />
              {suffix && (
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
          </FieldShell>
        )
      }}
    />
  )
}

/**
 * ช่องกรอกตัวเลข (เก็บเป็น string เพื่อให้ว่างได้ ตรวจรูปแบบใน schema)
 * - decimal = มีทศนิยมได้ (เปิดแป้นตัวเลขแบบมีจุดบนมือถือ)
 * - stepper = มีปุ่มเพิ่ม/ลด (จำนวนเต็มไม่ติดลบ เช่น จำนวนพี่น้อง)
 */
export function NumberField<T extends FieldValues>({
  decimal,
  stepper,
  ...props
}: Omit<React.ComponentProps<typeof TextField<T>>, "type" | "inputMode"> & { decimal?: boolean; stepper?: boolean }) {
  return (
    <TextField
      {...props}
      type={stepper ? "number" : "text"}
      min={stepper ? 0 : undefined}
      step={stepper ? 1 : undefined}
      inputMode={decimal ? "decimal" : "numeric"}
      placeholder={props.placeholder ?? (decimal ? "0.00" : "0")}
      inputClassName={cn("text-right", props.inputClassName)}
    />
  )
}

// ---------------------------------------------------------------------------
// ช่องวันที่ (แสดงและพิมพ์เป็น พ.ศ. วว/ดด/ปปปป แต่เก็บค่าเป็น YYYY-MM-DD ค.ศ.)
// ---------------------------------------------------------------------------

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** 2025-06-08 → 08/06/2568 (ค่าที่ไม่ใช่วันที่ คืนค่าเดิม) */
function isoToThai(value: string) {
  const m = ISO_DATE.exec(value)
  return m ? `${m[3]}/${m[2]}/${Number(m[1]) + 543}` : value
}

/** 08/06/2568 → 2025-06-08 (รับปี ค.ศ. ได้ด้วย) คืน null ถ้าไม่ใช่วันที่จริง */
function thaiToIso(text: string) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text)
  if (!m) return null
  const [day, month] = [Number(m[1]), Number(m[2])]
  const year = Number(m[3]) > 2400 ? Number(m[3]) - 543 : Number(m[3])
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** ใส่ / ให้อัตโนมัติตอนพิมพ์ตัวเลข: 08062568 → 08/06/2568 */
function maskThaiDate(typed: string) {
  const digits = typed.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function ThaiDateInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  disabled,
  invalid,
}: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: React.Ref<HTMLInputElement>
  disabled?: boolean
  invalid: boolean
}) {
  // ระหว่างพิมพ์เก็บข้อความไว้ก่อน (null = แสดงจากค่าในฟอร์ม)
  const [draft, setDraft] = useState<string | null>(null)
  const pickerRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        ref={inputRef}
        inputMode="numeric"
        autoComplete="off"
        placeholder="วว/ดด/ปปปป"
        maxLength={10}
        value={draft ?? isoToThai(value)}
        onChange={(e) => {
          const text = maskThaiDate(e.target.value)
          setDraft(text)
          // พิมพ์ยังไม่ครบ/ผิด เก็บข้อความไว้ให้ schema ฟ้อง "วันที่ไม่ถูกต้อง"
          onChange(text === "" ? "" : (thaiToIso(text) ?? text))
        }}
        onBlur={() => {
          setDraft(null)
          onBlur()
        }}
        disabled={disabled}
        aria-invalid={invalid}
        className="pr-9"
      />
      <button
        type="button"
        aria-label="เลือกวันที่จากปฏิทิน"
        disabled={disabled}
        onClick={() => pickerRef.current?.showPicker()}
        className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <CalendarDays className="size-4" />
      </button>
      {/* ปฏิทินของ browser (ซ่อนไว้ เปิดด้วยปุ่มด้านบน) */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={ISO_DATE.test(value) ? value : ""}
        onChange={(e) => {
          setDraft(null)
          onChange(e.target.value)
        }}
        className="pointer-events-none absolute bottom-0 left-0 h-0 w-full opacity-0"
      />
    </div>
  )
}

/** ช่องวันที่: พิมพ์/แสดงเป็น พ.ศ. (วว/ดด/ปปปป) หรือกดปุ่มปฏิทิน ค่าที่เก็บเป็น YYYY-MM-DD */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  layout,
  className,
}: BaseProps<T, string>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          name={name}
          label={label}
          description={description}
          required={required}
          layout={layout}
          invalid={fieldState.invalid}
          error={fieldState.error}
          className={className}
        >
          <ThaiDateInput
            id={name}
            name={field.name}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            disabled={disabled}
            invalid={fieldState.invalid}
          />
        </FieldShell>
      )}
    />
  )
}

// ---------------------------------------------------------------------------
// ช่องเลือก / ช่องติ๊ก / ช่องข้อความยาว
// ---------------------------------------------------------------------------

export type SelectOption = string | { value: string; label: string }

/**
 * ช่องเลือกจากรายการ (native select ใช้ง่ายบนมือถือ)
 * ถ้าค่าในฐานข้อมูลไม่อยู่ในรายการ (เช่นข้อมูลเก่าจาก Access) จะแสดงค่านั้นเพิ่มให้ ไม่ให้ข้อมูลหาย
 */
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  layout,
  className,
  options,
  placeholder = "-- เลือก --",
}: BaseProps<T, string> & { options: readonly SelectOption[]; placeholder?: string }) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value: string = field.value ?? ""
        const unknownValue = value !== "" && !normalized.some((o) => o.value === value)
        return (
          <FieldShell
            name={name}
            label={label}
            description={description}
            required={required}
            layout={layout}
            invalid={fieldState.invalid}
            error={fieldState.error}
            className={className}
          >
            <NativeSelect
              id={name}
              name={field.name}
              ref={field.ref}
              value={value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className={cn("w-full", value === "" && "[&_select]:text-muted-foreground")}
            >
              <NativeSelectOption value="">{placeholder}</NativeSelectOption>
              {unknownValue && <NativeSelectOption value={value}>{value}</NativeSelectOption>}
              {normalized.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FieldShell>
        )
      }}
    />
  )
}

/** ช่องติ๊ก (ค่าเป็น boolean) */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: Omit<BaseProps<T, boolean>, "required" | "layout">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid} className={cn("min-h-8 w-auto", className)}>
          <Checkbox
            id={name}
            name={field.name}
            inputRef={field.ref}
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          />
          <FieldLabel htmlFor={name} className="font-normal">
            {label}
          </FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/** ช่องกรอกข้อความหลายบรรทัด */
export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  layout,
  className,
  rows = 3,
  placeholder,
}: BaseProps<T, string> & { rows?: number; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          name={name}
          label={label}
          description={description}
          required={required}
          layout={layout}
          invalid={fieldState.invalid}
          error={fieldState.error}
          className={className}
        >
          <Textarea
            id={name}
            rows={rows}
            placeholder={placeholder}
            name={field.name}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          />
        </FieldShell>
      )}
    />
  )
}
