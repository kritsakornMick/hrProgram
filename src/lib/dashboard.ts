import "server-only"

/**
 * ตัวเลขบนหน้าหลัก
 *
 * TODO (น้อง A, ขั้น 2): ตอนนี้เป็นตัวเลขปลอม ให้เปลี่ยนเป็น query จริงด้วย db
 * เช่น newApplicants = db.applicant.count({ where: { appliedAt: { gte: ต้นเดือน } } })
 * - pendingDocumentChecks : document_check ที่ isComplete = false
 * - interviewsToday       : interview ที่ interviewedAt = วันนี้
 * - probationEndingSoon   : interview ที่ probationEndDate อยู่ใน 14 วันข้างหน้า
 * - contractsEndingSoon   : customer ที่ endDate อยู่ใน 30 วันข้างหน้า
 */
export async function getDashboardStats() {
  return {
    newApplicants: 12,
    pendingDocumentChecks: 3,
    interviewsToday: 1,
    probationEndingSoon: 2,
    contractsEndingSoon: 4,
  }
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>
