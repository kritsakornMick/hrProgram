<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# กติกาโปรเจกต์ระบบ HR (สำหรับทีมและ AI ทุกตัว)

ระบบบริหารทรัพยากรบุคคล บริษัท สปีดี้แพคเก็จ เอ็กซ์เพรส ย้ายมาจากโปรแกรม Access
ผู้ใช้คือฝ่าย HR ข้อมูลมีเลขบัตรประชาชน บัญชีธนาคาร ประวัติคดี (อยู่ภายใต้ PDPA)

## Stack และเวอร์ชัน (เขียนโค้ดให้ตรงเวอร์ชันนี้ ไม่ใช่ตามที่จำมา)

| ส่วน | ใช้ | ข้อควรระวัง |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 | ใช้ `src/proxy.ts` ไม่ใช่ `middleware.ts` · `params` และ `searchParams` เป็น Promise ต้อง `await` · ปิด `cacheComponents` ไว้ ห้ามเปิด |
| ภาษา | TypeScript (strict) | ห้ามใช้ `any` |
| UI | Tailwind CSS 4 + shadcn/ui (สไตล์ base-nova ใช้ **Base UI** ไม่ใช่ Radix) | ใช้ prop `render` แทน `asChild` เช่น `<SidebarMenuButton render={<Link href="/x" />}>` · ลิงก์ที่หน้าตาเป็นปุ่มใช้ `<Link className={buttonVariants()}>` |
| ฟอร์ม | React Hook Form + Zod 4 + `@hookform/resolvers/zod` | ใช้ component `Field`, `FieldLabel`, `FieldError` จาก `@/components/ui/field` |
| ฐานข้อมูล | PostgreSQL 17 + Prisma 7 | import client จาก `@/lib/db` เท่านั้น · type ของ model อยู่ที่ `@/generated/prisma/client` · หลัง migrate ต้อง `prisma generate` (ใช้ `npm run db:migrate`) |
| ล็อกอิน | Better Auth 1.7 (+ admin plugin) | ใช้ `requireUser`, `requirePageRole`, `requireRole` จาก `@/lib/session` |
| วันที่ | dayjs + พ.ศ. | แสดงวันที่ด้วย `formatThaiDate` / `formatThaiDateLong` จาก `@/lib/dates` |
| PDF | HTML + Gotenberg | (ทำในขั้น 2) |

## โครงสร้างไฟล์

```
src/
  app/
    (app)/                  ทุกหน้าหลังล็อกอิน (มี header + เมนูซ้าย)
      page.tsx              หน้าหลัก (dashboard)
      companies/            ★ หน้าตัวอย่าง: ทำทุกหน้าตามรูปแบบนี้
        page.tsx            หน้ารายการ (Server Component, ดึงข้อมูลด้วย db ตรงๆ)
        schema.ts           กติกาตรวจข้อมูล (Zod) ใช้ทั้งฟอร์มและ Server Action
        actions.ts          Server Actions (เพิ่ม/แก้/ลบ)
        company-form.tsx    ฟอร์ม (Client Component) ใช้ทั้งเพิ่มและแก้ไข
        new/page.tsx        หน้าเพิ่ม
        [id]/edit/page.tsx  หน้าแก้ไข
      customers/page.tsx    หน้า "กำลังพัฒนา" รอคนมาทำ (เรียก <ComingSoon />)
    login/                  หน้าเข้าสู่ระบบ
  components/
    ui/                     component ของ shadcn (ห้ามแก้ ถ้าจำเป็นต้องแก้ให้ถาม Tech Lead)
    layout/                 header, เมนูซ้าย, โลโก้
    dashboard/              ชิ้นส่วนหน้าหลัก
    page-header.tsx         หัวของทุกหน้า
  lib/
    db.ts  auth.ts  session.ts  permissions.ts  audit.ts
    menu.ts                 แผนผังเมนูทั้งระบบ (เมนูซ้าย + หน้าหลักสร้างจากไฟล์นี้)
    validators.ts           ตัวตรวจข้อมูลที่ใช้ซ้ำ (เลขบัตร, อีเมล, เลขภาษี)
    dates.ts                วันที่ภาษาไทย พ.ศ.
prisma/
  schema.prisma             โครงสร้างตาราง (แก้ได้เฉพาะ Tech Lead)
  seed.ts                   ข้อมูลปลอม
docs/design/                ภาพดีไซน์อ้างอิง
```

## วิธีทำหน้าใหม่ (เช่น หน่วยงานลูกค้า)

1. อ่านโค้ดใน `src/app/(app)/companies/` ให้เข้าใจก่อน แล้วทำตามรูปแบบเดียวกัน
2. ลบ `<ComingSoon />` ใน `page.tsx` ของหน้านั้น แล้วเขียนหน้าจริง
3. ใช้ชื่อตารางและชื่อช่องตาม `prisma/schema.prisma` เท่านั้น ห้ามตั้งชื่อเอง
4. ทำเสร็จแล้วเปลี่ยน `ready: true` ของหน้านั้นใน `src/lib/menu.ts`

## Server Action ต้องทำครบ 6 ขั้นทุกตัว (ดู `companies/actions.ts`)

1. `requireRole([...])` เช็คสิทธิ์ก่อนเสมอ
2. `schema.safeParse(input)` ตรวจข้อมูลซ้ำฝั่ง server
3. บันทึกด้วย `db` (ใช้ `emptyToNull` แปลงช่องว่างเป็น null)
4. `audit(user, action, entity, id)` บันทึกประวัติ
5. `revalidatePath(...)`
6. คืนค่าแบบ `ActionResult` (`{ ok: true, message }` หรือ `{ ok: false, error, fieldErrors }`)

## สิทธิ์ (src/lib/permissions.ts)

- `admin` ทำได้ทุกอย่าง · `hr` เพิ่ม/แก้ข้อมูลงาน HR · `viewer` ดูอย่างเดียว
- หน้าที่จำกัดสิทธิ์ใช้ `requirePageRole`, Server Action ใช้ `requireRole`
- ซ่อนปุ่มที่ผู้ใช้ไม่มีสิทธิ์ แต่ต้องเช็คสิทธิ์ใน Server Action ด้วยเสมอ

## หน้าตา (ธีม Speedy เขียว-ส้ม)

- **ห้ามใส่รหัสสีตรงๆ** (`#xxxxxx`, `bg-green-600`) ให้ใช้ตัวแปรธีมใน `src/app/globals.css`:
  `bg-primary`, `text-brand-orange`, `bg-tint-green`, `text-muted-foreground`, `bg-destructive` ฯลฯ
- ทุกหน้าเริ่มด้วย `<PageHeader icon=... title=... />`
- เนื้อหาอยู่ใน `<Card>` · ตารางใช้ `@/components/ui/table`
- ข้อความบนหน้าจอเป็นภาษาไทยทั้งหมด · ชื่อตัวแปร ฟังก์ชัน ไฟล์ เป็นภาษาอังกฤษ
- ต้องใช้งานได้บนจอมือถือ (ไม่มี scroll แนวนอน)

## ห้ามทำ

- ห้ามแก้ `prisma/schema.prisma` หรือสร้าง migration เอง → ขอ Tech Lead
- ห้ามเพิ่ม library (`npm install`) เอง → ขอ Tech Lead
- ห้ามใช้ `@supabase/supabase-js`, `fetch` ไป API ของตัวเอง, หรือ ORM อื่น → ใช้ `db` (Prisma) ใน Server Component / Server Action
- ห้ามเปิด `cacheComponents` หรือใช้ `"use cache"`
- ห้ามใส่ข้อมูลจริง (ชื่อ เลขบัตร เบอร์โทร) ในโค้ด, seed, หรือ prompt ของ AI → ใช้ข้อมูลปลอมเท่านั้น
- ห้าม commit ไฟล์ `.env`
- ห้าม push เข้า `main` ตรงๆ → เปิด Pull Request

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # เปิดเว็บที่ http://localhost:3000
npm run check        # lint + typecheck (ต้องผ่านก่อนเปิด PR)
npm run db:migrate   # หลัง git pull ถ้ามี migration ใหม่
npm run db:seed      # ใส่ข้อมูลปลอมใหม่
npm run db:reset     # ล้างฐานข้อมูลในเครื่องแล้วสร้างใหม่ทั้งหมด
npm run db:studio    # ดูข้อมูลในตาราง
```

## งานเสร็จเมื่อ (Definition of Done)

- ทำครบตามสเปกใน GitHub issue
- ทดสอบในเครื่องแล้ว ทั้งเพิ่ม/แก้/ลบ และกรอกข้อมูลผิด
- `npm run check` ผ่าน
- เปิด PR พร้อมแคปหน้าจอ และอธิบายได้ว่าโค้ดทำงานอย่างไร
