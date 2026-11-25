"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Building, Plus, Save, Trash2, Users, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createCustomer, updateCustomer } from "./actions"
import { customerSchema, customerStatusOptions, type CustomerInput } from "./schema"

type CompanyOption = {
  id: number
  nameTh: string
}

type Props = {
  customerId?: number
  companies: CompanyOption[]
  defaultValues: CustomerInput
}

export function CustomerForm({ customerId, companies, defaultValues }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  })

  const [newContact, setNewContact] = useState({
    name: "",
    department: "",
    phone: "",
    email: "",
    note: "",
  })

  function handleAddContact() {
    if (!newContact.name.trim()) {
      toast.error("กรุณาระบุชื่อผู้ติดต่อก่อนเพิ่มรายการ")
      return
    }
    append({
      name: newContact.name.trim(),
      department: newContact.department.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
      note: newContact.note.trim(),
    })
    setNewContact({ name: "", department: "", phone: "", email: "", note: "" })
  }

  function onSubmit(values: CustomerInput) {
    startTransition(async () => {
      const result = customerId ? await updateCustomer(customerId, values) : await createCustomer(values)
      if (!result.ok) {
        toast.error(result.error)
        for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as keyof CustomerInput, { message: messages[0] })
        }
        return
      }
      toast.success(result.message)
      router.push("/customers")
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* การ์ดที่ 1: รายละเอียดหน่วยงานลูกค้าในเครือ */}
      <Card className="overflow-hidden pt-0">
        <CardHeader className="bg-primary py-3.5 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="size-4" />
            รายละเอียดหน่วยงานลูกค้าในเครือ
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <FieldGroup className="grid gap-5 md:grid-cols-12">
            {/* แถวที่ 1: ID Customer | สถานะ | ภายใต้บริษัท */}
            <Field className="md:col-span-4">
              <FieldLabel htmlFor="customerCode">ID Customer</FieldLabel>
              <Input
                id="customerCode"
                value={customerId ? `CUST${String(customerId).padStart(3, "0")}` : "(สร้างอัตโนมัติ)"}
                disabled
                className="bg-muted"
              />
            </Field>

            <Controller
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-4">
                  <FieldLabel htmlFor="status">
                    สถานะ <span className="text-destructive">*</span>
                  </FieldLabel>
                  <select
                    id="status"
                    aria-invalid={fieldState.invalid}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    {...field}
                  >
                    {customerStatusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="companyId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-4">
                  <FieldLabel htmlFor="companyId">
                    ภายใต้บริษัท <span className="text-destructive">*</span>
                  </FieldLabel>
                  <select
                    id="companyId"
                    aria-invalid={fieldState.invalid}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    {...field}
                  >
                    <option value="">-- เลือกบริษัทในเครือ --</option>
                    {companies.map((company) => (
                      <option key={company.id} value={String(company.id)}>
                        {company.nameTh}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* แถวที่ 2: ชื่อหน่วยงาน | ชื่องาน */}
            <TextField form={form} name="name" label="ชื่อหน่วยงาน" required className="md:col-span-7" />
            <TextField form={form} name="jobName" label="ชื่องาน" className="md:col-span-5" />

            {/* แถวที่ 3: ที่อยู่หน่วยงาน */}
            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-12">
                  <FieldLabel htmlFor="address">ที่อยู่หน่วยงาน</FieldLabel>
                  <Textarea id="address" rows={2} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            {/* แถวที่ 4: โทรศัพท์ | อีเมล | วันเริ่มงาน | วันสิ้นสุดงาน */}
            <TextField form={form} name="phone" label="โทรศัพท์หน่วยงาน" inputMode="tel" className="md:col-span-3" />
            <TextField form={form} name="email" label="อีเมล์หน่วยงาน" type="email" className="md:col-span-3" />
            <TextField form={form} name="startDate" label="วันเริ่มงาน" type="date" className="md:col-span-3" />
            <TextField form={form} name="endDate" label="วันสิ้นสุดงาน" type="date" className="md:col-span-3" />

            {/* แถวที่ 5: มูลค่าของงาน | ค่าปรับต่อวัน | จำนวนพนักงาน | พนักงานสำรอง */}
            <TextField
              form={form}
              name="contractValue"
              label="มูลค่าของงาน (บาท)"
              type="number"
              step="0.01"
              className="text-right md:col-span-4"
            />
            <TextField
              form={form}
              name="dailyPenalty"
              label="ค่าปรับต่อวัน (บาท)"
              type="number"
              step="0.01"
              className="text-right md:col-span-4"
            />
            <TextField
              form={form}
              name="headcount"
              label="จำนวนพนักงาน (คน)"
              type="number"
              className="md:col-span-2"
            />
            <TextField
              form={form}
              name="reserveHeadcount"
              label="พนักงานสำรอง (คน)"
              type="number"
              className="md:col-span-2"
            />

            {/* แถวที่ 6: หมายเหตุ */}
            <Controller
              control={form.control}
              name="note"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="md:col-span-12">
                  <FieldLabel htmlFor="note">หมายเหตุ</FieldLabel>
                  <Textarea id="note" rows={2} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* การ์ดที่ 2: รายชื่อผู้ติดต่อ */}
      <Card className="overflow-hidden pt-0">
        <CardHeader className="bg-primary py-3.5 text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            รายชื่อผู้ติดต่อ
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* แถวกรอกเพิ่มผู้ติดต่อ */}
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <Input
                placeholder="ชื่อผู้ติดต่อ"
                value={newContact.name}
                onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="ฝ่าย"
                value={newContact.department}
                onChange={(e) => setNewContact((prev) => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="เบอร์โทรติดต่อ"
                inputMode="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="md:col-span-3">
              <Input
                placeholder="อีเมลผู้ติดต่อ"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={handleAddContact}
                className="w-full bg-brand-orange text-white hover:bg-brand-orange/90"
              >
                <Plus />
                เพิ่มผู้ติดต่อ
              </Button>
            </div>
          </div>

          {/* ตารางรายชื่อผู้ติดต่อ */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ติดต่อ</TableHead>
                <TableHead>ฝ่าย</TableHead>
                <TableHead>เบอร์โทรติดต่อ</TableHead>
                <TableHead>อีเมลผู้ติดต่อ</TableHead>
                <TableHead className="hidden md:table-cell">หมายเหตุ</TableHead>
                <TableHead className="w-16 text-center">ลบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    ยังไม่มีรายชื่อผู้ติดต่อ (กรอกข้อมูลด้านบนแล้วกดปุ่ม “เพิ่มผู้ติดต่อ”)
                  </TableCell>
                </TableRow>
              )}
              {fields.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input {...form.register(`contacts.${index}.name`)} className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Input {...form.register(`contacts.${index}.department`)} className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Input {...form.register(`contacts.${index}.phone`)} className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Input {...form.register(`contacts.${index}.email`)} className="h-8" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Input {...form.register(`contacts.${index}.note`)} placeholder="หมายเหตุ" className="h-8" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(index)}
                      aria-label={`ลบผู้ติดต่อ ${item.name}`}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ปุ่มบันทึกข้อมูล */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <Button type="submit" disabled={pending} size="lg" className="min-w-36 rounded-xl">
          <Save />
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href="/customers"
          className={buttonVariants({
            variant: "ghost",
            size: "lg",
            className: "min-w-36 rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90",
          })}
        >
          <X />
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}

function TextField({
  form,
  name,
  label,
  required,
  className,
  ...inputProps
}: {
  form: ReturnType<typeof useForm<CustomerInput>>
  name: Exclude<keyof CustomerInput, "contacts">
  label: string
  required?: boolean
} & Omit<React.ComponentProps<typeof Input>, "form" | "name">) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>
            {label}
            {required && <span className="text-destructive">*</span>}
          </FieldLabel>
          <Input id={name} aria-invalid={fieldState.invalid} {...inputProps} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}