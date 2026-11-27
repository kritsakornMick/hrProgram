"use client"

import { Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { deleteReferral } from "./actions"

/** ปุ่มลบหนังสือส่งตัว (ยืนยันก่อนลบ) */
export function DeleteReferralButton({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteReferral(id)
      setOpen(false)
      if (result.ok) toast.success(result.message)
      else toast.error(result.error)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`ลบหนังสือลำดับที่ ${id}`} />}>
        <Trash2 className="text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบหนังสือส่งตัว</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบหนังสือลำดับที่ {id} ของ “{name}” ใช่ไหม ลบแล้วกู้คืนไม่ได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "กำลังลบ..." : "ลบ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
