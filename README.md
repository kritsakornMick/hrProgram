# ระบบบริหารทรัพยากรบุคคล (HR Management System)

ระบบสรรหาและจ้างพนักงานของบริษัท สปีดี้แพคเก็จ เอ็กซ์เพรส ย้ายจากโปรแกรม Access ขึ้นเป็นเว็บ

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS + shadcn/ui · PostgreSQL + Prisma 7 · Better Auth · Docker

กติกาการเขียนโค้ดอยู่ใน [AGENTS.md](./AGENTS.md) (อ่านก่อนเริ่มงาน AI ที่ใช้ก็อ่านไฟล์นี้อัตโนมัติ)

---

## 1. โปรแกรมที่ต้องติดตั้งก่อน

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) เวอร์ชัน 22 (LTS)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows: เลือก WSL 2)
- [VS Code](https://code.visualstudio.com/) เปิดโปรเจกต์แล้วกด **Install** ตอนที่ VS Code แนะนำ extension

เช็คว่าติดตั้งครบ:

```bash
git --version
node --version
docker --version
```

## 2. ติดตั้งโปรเจกต์ (ครั้งแรก)

```bash
git clone https://github.com/kritsakornMick/hrProgram.git
cd hrProgram
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

เปิด http://localhost:3000 แล้วล็อกอินด้วยบัญชีทดสอบ (รหัสผ่าน `password123`):

| อีเมล | สิทธิ์ |
| --- | --- |
| admin@example.com | ผู้ดูแลระบบ (ทำได้ทุกอย่าง) |
| hr@example.com | เจ้าหน้าที่ HR |
| viewer@example.com | ดูอย่างเดียว |

> Windows (PowerShell): ใช้ `copy .env.example .env` แทน `cp`

## 3. ทุกวันก่อนเริ่มงาน

1. เปิด Docker Desktop
2. ดึงโค้ดล่าสุดและอัปเดตฐานข้อมูล:

```bash
git checkout main
git pull
npm install
npm run db:migrate
npm run dev
```

## 4. ขั้นตอนทำงาน 1 งาน (1 issue = 1 branch = 1 Pull Request)

| ขั้น | ใน VS Code (แท็บ Source Control) | คำสั่ง terminal |
| --- | --- | --- |
| แตก branch | กดชื่อ branch มุมล่างซ้าย → Create new branch | `git checkout -b feature/customers` |
| ทดสอบในเครื่อง | — | `npm run dev` |
| ตรวจก่อนส่ง | — | `npm run check` |
| commit | พิมพ์ข้อความ → กด ✓ Commit | `git add .` แล้ว `git commit -m "เพิ่มหน้าหน่วยงานลูกค้า"` |
| ส่งขึ้น GitHub | กด Publish Branch | `git push -u origin feature/customers` |
| เปิด PR | ไปที่ GitHub กด **Compare & pull request** | — |

จากนั้นรอ CI ผ่าน (✓ สีเขียว) และ Tech Lead review แก้ตามความเห็นแล้ว push ซ้ำได้เลย

## 5. คำสั่งที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run dev` | เปิดเว็บในเครื่อง |
| `npm run check` | ตรวจ lint + TypeScript (ต้องผ่านก่อนเปิด PR) |
| `npm run db:migrate` | อัปเดตตารางในฐานข้อมูลให้ตรงกับโค้ดล่าสุด |
| `npm run db:seed` | ใส่ข้อมูลปลอมใหม่ |
| `npm run db:reset` | ฐานข้อมูลในเครื่องพัง: ล้างแล้วสร้างใหม่ทั้งหมด (ไม่กระทบเครื่องคนอื่น) ต้องพิมพ์เองใน terminal เพราะ Prisma ไม่ยอมให้ AI รันคำสั่งนี้ |
| `npm run db:studio` | เปิดดูข้อมูลในตารางผ่านเบราว์เซอร์ |
| `docker compose up -d` / `docker compose down` | เปิด / ปิด ฐานข้อมูลและตัวแปลง PDF |

## 6. แก้ปัญหาที่เจอบ่อย

| อาการ | วิธีแก้ |
| --- | --- |
| `Can't reach database server at localhost:5432` | ยังไม่ได้เปิด Docker Desktop หรือยังไม่ได้รัน `docker compose up -d` |
| `port 5432 is already allocated` | เครื่องมี PostgreSQL อื่นรันอยู่ ปิดตัวนั้นก่อน |
| TypeScript ฟ้องว่าไม่มี field ที่เพิ่งเพิ่ม | รัน `npm run db:migrate` (มีการ `prisma generate` ในตัว) |
| ล็อกอินไม่ได้ | รัน `npm run db:seed` ใหม่ |
