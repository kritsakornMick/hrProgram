/**
 * ข้อมูลปลอมสำหรับพัฒนาและทดสอบ — ห้ามใส่ข้อมูลจริงในไฟล์นี้
 *
 * รัน: npx prisma db seed
 * ทุกเครื่องได้ข้อมูลชุดเดียวกัน (ใช้ seed คงที่) และรันซ้ำได้ (ล้างข้อมูลเดิมก่อน)
 */
import "dotenv/config"
import { fakerTH as faker } from "@faker-js/faker"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "better-auth/crypto"
import { PrismaClient } from "../src/generated/prisma/client"

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

faker.seed(2569)

const PROVINCES = ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "ชลบุรี", "ระยอง", "นครปฐม", "อยุธยา"]
const POSITIONS = ["พนักงานขับรถ", "พนักงานคัดแยกพัสดุ", "พนักงานรักษาความปลอดภัย", "แม่บ้าน", "ธุรการ", "พนักงานคลังสินค้า"]
const EDUCATION = ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี"]

const pick = <T,>(arr: readonly T[]) => faker.helpers.arrayElement(arr)
const phone = () => `08${faker.string.numeric(8)}`
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000)

/** เลขบัตรประชาชนปลอมที่ผ่านการตรวจ checksum (ขึ้นต้น 9 ซึ่งไม่ใช่เลขที่ออกจริง) */
function fakeNationalId() {
  const digits = ("9" + faker.string.numeric(11)).split("").map(Number)
  const sum = digits.reduce((acc, d, i) => acc + d * (13 - i), 0)
  return digits.join("") + String((11 - (sum % 11)) % 10)
}

async function createUser(email: string, name: string, role: "admin" | "hr" | "viewer", password: string) {
  const id = faker.string.alphanumeric(24)
  await db.user.create({
    data: {
      id,
      email,
      name,
      role,
      emailVerified: true,
      accounts: {
        create: {
          id: faker.string.alphanumeric(24),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  })
  return id
}

async function main() {
  console.log("ล้างข้อมูลเดิม...")
  await db.auditLog.deleteMany()
  await db.guaranteeContract.deleteMany()
  await db.assignmentLetter.deleteMany()
  await db.interviewReferralLetter.deleteMany()
  await db.backgroundCheckAuthorization.deleteMany()
  await db.employmentContract.deleteMany()
  await db.interview.deleteMany()
  await db.documentAttachment.deleteMany()
  await db.documentCheck.deleteMany()
  await db.applicant.deleteMany()
  await db.customerContact.deleteMany()
  await db.customer.deleteMany()
  await db.company.deleteMany()
  await db.staff.deleteMany()
  await db.session.deleteMany()
  await db.account.deleteMany()
  await db.user.deleteMany()

  console.log("สร้างผู้ใช้...")
  const password = process.env.SEED_PASSWORD ?? "password123"
  const adminId = await createUser("admin@example.com", "ผู้ดูแลระบบ", "admin", password)
  const hrId = await createUser("hr@example.com", "เจ้าหน้าที่ HR", "hr", password)
  await createUser("viewer@example.com", "ผู้ใช้ดูอย่างเดียว", "viewer", password)

  console.log("สร้างพนักงาน HR...")
  const staff = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      db.staff.create({
        data: {
          code: `HR${String(i + 1).padStart(3, "0")}`,
          name: faker.person.fullName(),
          position: i === 0 ? "หัวหน้าฝ่ายบุคคล" : "เจ้าหน้าที่สรรหา",
          department: "ฝ่ายทรัพยากรบุคคล",
          phone: phone(),
          email: `staff${i + 1}@example.com`,
          status: "ทำงาน",
          startDate: faker.date.past({ years: 5 }),
          userId: i === 0 ? adminId : i === 1 ? hrId : null,
        },
      }),
    ),
  )

  console.log("สร้างบริษัทและหน่วยงานลูกค้า...")
  const companies = await Promise.all(
    [
      { code: "C01", nameTh: "บริษัท ตัวอย่างหนึ่ง จำกัด", nameEn: "Sample One Co., Ltd." },
      { code: "C02", nameTh: "บริษัท ตัวอย่างสอง จำกัด", nameEn: "Sample Two Co., Ltd." },
      { code: "C03", nameTh: "บริษัท ตัวอย่างสาม จำกัด", nameEn: "Sample Three Co., Ltd." },
    ].map((c) =>
      db.company.create({
        data: {
          ...c,
          taxId: `0${faker.string.numeric(12)}`,
          address: `${faker.location.buildingNumber()} ถ.${faker.location.street()} ${pick(PROVINCES)}`,
          phone: `02${faker.string.numeric(7)}`,
          email: `contact@${c.code.toLowerCase()}.example.com`,
        },
      }),
    ),
  )

  const customers = []
  for (let i = 0; i < 20; i++) {
    const start = faker.date.past({ years: 2 })
    const customer = await db.customer.create({
      data: {
        name: `หน่วยงานตัวอย่าง ${i + 1}`,
        jobName: `จ้างเหมาบริการ${pick(POSITIONS)}`,
        status: i % 6 === 0 ? "สิ้นสุดสัญญา" : "ดำเนินการ",
        address: `${pick(PROVINCES)}`,
        phone: `02${faker.string.numeric(7)}`,
        email: `unit${i + 1}@example.com`,
        companyId: pick(companies).id,
        startDate: start,
        endDate: i < 4 ? daysFromNow(10 + i * 5) : daysFromNow(faker.number.int({ min: 60, max: 600 })),
        contractValue: faker.number.int({ min: 200_000, max: 5_000_000 }),
        dailyPenalty: faker.number.int({ min: 500, max: 5_000 }),
        headcount: faker.number.int({ min: 2, max: 40 }),
        reserveHeadcount: faker.number.int({ min: 0, max: 3 }),
        contacts: {
          create: [{ name: faker.person.fullName(), department: "จัดซื้อ", phone: phone(), email: `buyer${i + 1}@example.com` }],
        },
      },
    })
    customers.push(customer)
  }

  console.log("สร้างผู้สมัคร ตรวจเอกสาร และสัมภาษณ์...")
  for (let i = 0; i < 40; i++) {
    const sex = faker.helpers.arrayElement(["male", "female"] as const)
    const applicant = await db.applicant.create({
      data: {
        appliedAt: faker.date.recent({ days: 60 }),
        position: pick(POSITIONS),
        expectedSalary: faker.number.int({ min: 12_000, max: 25_000 }),
        fullNameTh: `${sex === "male" ? "นาย" : "นางสาว"}${faker.person.fullName({ sex })}`,
        nationalId: fakeNationalId(),
        birthDate: faker.date.birthdate({ min: 20, max: 50, mode: "age" }),
        nationality: "ไทย",
        ethnicity: "ไทย",
        religion: "พุทธ",
        addressNo: faker.location.buildingNumber(),
        subdistrict: "ตำบลตัวอย่าง",
        district: "อำเภอตัวอย่าง",
        province: pick(PROVINCES),
        mobilePhone: phone(),
        maritalStatus: pick(["โสด", "สมรส"]),
        educationLevel: pick(EDUCATION),
        hasMotorcycleLicense: faker.datatype.boolean(),
        hasCarLicense: faker.datatype.boolean(),
        canUseWord: faker.datatype.boolean(),
        canUseExcel: faker.datatype.boolean(),
        emergencyContactName: faker.person.fullName(),
        emergencyContactRelation: pick(["บิดา", "มารดา", "พี่", "คู่สมรส"]),
        emergencyContactPhone: phone(),
        jobSource: pick(["Facebook", "เพื่อนแนะนำ", "ป้ายประกาศ", "เว็บไซต์หางาน"]),
      },
    })

    if (i % 4 === 3) continue // ผู้สมัครบางคนยังไม่ได้ตรวจเอกสาร

    const complete = i % 5 !== 0
    const check = await db.documentCheck.create({
      data: {
        applicantId: applicant.id,
        checkedById: pick(staff).id,
        checkedAt: faker.date.recent({ days: 30 }),
        hasPhoto: true,
        hasIdCard: true,
        hasHouseRegistration: complete,
        hasEducationCert: complete,
        isComplete: complete,
        comment: complete ? null : "รอเอกสารเพิ่มเติม",
      },
    })

    if (!complete || i % 3 === 0) continue

    const passed = i % 7 !== 0
    const start = faker.date.recent({ days: 40 })
    const interview = await db.interview.create({
      data: {
        documentCheckId: check.id,
        customerId: pick(customers).id,
        staffId: pick(staff).id,
        interviewedAt: i % 9 === 1 ? new Date() : faker.date.recent({ days: 45 }),
        result: passed ? "ผ่าน" : "ไม่ผ่าน",
        position: applicant.position,
        wageRate: passed ? faker.number.int({ min: 12_000, max: 22_000 }) : null,
        startDate: passed ? start : null,
        probationStartDate: passed ? start : null,
        probationEndDate: passed ? daysFromNow(faker.number.int({ min: 3, max: 110 })) : null,
        probationDays: passed ? 119 : null,
      },
    })

    if (!passed) continue

    await db.interviewReferralLetter.create({
      data: { interviewId: interview.id, letterNo: `SR-${1000 + i}`, documentDate: start, addressedTo: "ผู้จัดการหน่วยงาน", issuedById: staff[0].id },
    })
    await db.employmentContract.create({ data: { interviewId: interview.id, contractDate: start } })
  }

  const counts = {
    users: await db.user.count(),
    companies: await db.company.count(),
    customers: await db.customer.count(),
    applicants: await db.applicant.count(),
    documentChecks: await db.documentCheck.count(),
    interviews: await db.interview.count(),
  }
  console.log("เสร็จแล้ว:", counts)
  console.log(`ล็อกอินด้วย admin@example.com / hr@example.com / viewer@example.com รหัสผ่าน: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
