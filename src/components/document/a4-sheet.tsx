import { cn } from "@/lib/utils"

/*
 * ชิ้นส่วนสำหรับทำเอกสารที่พิมพ์ (หนังสือ สัญญา ฯลฯ) ใช้ได้ทั้งตัวอย่างในฟอร์มและหน้าพิมพ์
 * ขนาดกระดาษ/ตัวอักษรกำหนดใน globals.css (.a4-frame / .a4-sheet)
 *
 * ตัวอย่าง:
 *   <A4Frame>
 *     <A4Sheet>
 *       <DocTitle>หนังสือมอบอำนาจ</DocTitle>
 *       <p>ข้าพเจ้า <Blank value={name} width={14} /></p>
 *     </A4Sheet>
 *   </A4Frame>
 */

/** กล่องที่กำหนดความกว้างให้กระดาษ (กระดาษจะกว้างเต็มกล่องนี้) */
export function A4Frame({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("a4-frame space-y-4 print:space-y-0", className)}>{children}</div>
}

/** กระดาษ A4 1 แผ่น (ตอนพิมพ์ขึ้นหน้าใหม่ทุกแผ่น) size="actual" = ขนาดจริง 210 มม. */
export function A4Sheet({
  size = "fit",
  className,
  children,
}: {
  size?: "fit" | "actual"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div data-size={size} className={cn("a4-sheet mx-auto shadow-md ring-1 ring-border print:ring-0", className)}>
      {children}
    </div>
  )
}

/** หัวเรื่องกลางหน้า */
export function DocTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-[1em] text-center">
      <h2 className="text-[1.3em] leading-snug font-bold">{children}</h2>
      {sub && <p className="text-[1.05em] font-bold">{sub}</p>}
    </div>
  )
}

/**
 * ช่องเติมข้อความในเอกสาร: มีค่า = แสดงค่าขีดเส้นใต้จุด, ไม่มีค่า = เส้นจุดว่างให้เขียนมือ
 * width = ความกว้างขั้นต่ำ (หน่วย em)
 */
export function Blank({ value, width = 8 }: { value?: string | null; width?: number }) {
  return (
    <span
      className="mx-[0.2em] inline-block border-b border-dotted border-current px-[0.3em] text-center leading-[1.45] indent-0"
      style={{ minWidth: `${width}em` }}
    >
      {value || " "}
    </span>
  )
}

/** ช่องลงลายมือชื่อ: ลงชื่อ ......... (บทบาท) และวงเล็บชื่อใต้เส้น */
export function Signature({ role, name }: { role: string; name?: string | null }) {
  return (
    <div className="text-center">
      <p className="whitespace-nowrap">
        ลงชื่อ
        <Blank width={9} />
        {role}
      </p>
      <p>
        (<Blank value={name} width={11} />)
      </p>
    </div>
  )
}
