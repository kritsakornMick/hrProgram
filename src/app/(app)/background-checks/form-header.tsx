import { ArrowLeft, IdCard } from "lucide-react"
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

/** หัวหน้าเพิ่ม/แก้ไขหนังสือ: breadcrumb + ชื่อหน้า + ปุ่มกลับ */
export function BackgroundCheckFormHeader({ crumb, title, description }: { crumb: string; title: string; description?: string }) {
  return (
    <>
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>หน้าแรก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/background-checks" />}>มอบอำนาจและตรวจประวัติ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{crumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        icon={IdCard}
        title={title}
        description={description}
        actions={
          <Link href="/background-checks" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft />
            กลับ
          </Link>
        }
      />
    </>
  )
}
