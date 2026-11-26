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
import { deleteInterview } from "./actions"

type Props = {
  interviewId: number
  applicantName: string
}

export function DeleteInterviewButton({ interviewId, applicantName }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteInterview(interviewId)
      setOpen(false)
      if (result.ok) toast.success(result.message)
      else toast.error(result.error)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`ลบข้อมูลสัมภาษณ์ของ ${applicantName}`} />}
      >
        <Trash2 className="text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบข้อมูลการสัมภาษณ์</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการลบข้อมูลการสัมภาษณ์รหัส INT{String(interviewId).padStart(3, "0")} “{applicantName}” ใช่ไหม ลบแล้วกู้คืนไม่ได้
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