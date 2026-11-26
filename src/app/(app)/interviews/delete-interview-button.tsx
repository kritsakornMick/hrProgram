"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteInterview } from "./actions"

type Props = {
  interviewId: number
  applicantName: string
}

export function DeleteInterviewButton({ interviewId, applicantName }: Props) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    const confirmed = window.confirm(`ยืนยันการลบข้อมูลการสัมภาษณ์ของ "${applicantName}" ใช่หรือไม่?`)
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteInterview(interviewId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(result.message)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={handleDelete}
      aria-label={`ลบข้อมูลสัมภาษณ์ของ ${applicantName}`}
    >
      <Trash2 className="text-destructive" />
    </Button>
  )
}