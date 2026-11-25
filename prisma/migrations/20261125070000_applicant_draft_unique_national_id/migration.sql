-- ใบสมัครที่บันทึกร่าง (ยังกรอกช่องบังคับไม่ครบ)
ALTER TABLE "applicant" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- เลขบัตรประชาชนห้ามซ้ำ (แทน index เดิม)
DROP INDEX "applicant_nationalId_idx";
CREATE UNIQUE INDEX "applicant_nationalId_key" ON "applicant"("nationalId");
