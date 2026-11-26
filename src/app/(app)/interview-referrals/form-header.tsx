import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"

/** หัวหน้าเพิ่ม/แก้ไขหนังสือส่งตัว: breadcrumb + ชื่อหน้า + ปุ่มกลับ */
export function ReferralFormHeader({ crumb, title, description }: { crumb: string; title: string; description?: string }) {
  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>หน้าแรก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/interview-referrals" />}>หนังสือส่งตัวเพื่อเข้าสัมภาษณ์</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{crumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        icon={Send}
        title={title}
        description={description}
        actions={
          <Link href="/interview-referrals" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft />
            กลับ
          </Link>
        }
      />
    </>
  )
}
