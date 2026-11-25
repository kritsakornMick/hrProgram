-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('PHOTO', 'ID_CARD', 'HOUSE_REGISTRATION', 'EDUCATION_CERT', 'CAR_LICENSE', 'MOTORCYCLE_LICENSE', 'DISABILITY_CARD', 'MILITARY_DOC', 'OTHER');

-- CreateTable
CREATE TABLE "company" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "headerImage" TEXT,
    "footerImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "status" TEXT,
    "name" TEXT NOT NULL,
    "jobName" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "companyId" INTEGER,
    "startDate" DATE,
    "endDate" DATE,
    "contractValue" DECIMAL(14,2),
    "dailyPenalty" DECIMAL(12,2),
    "headcount" INTEGER,
    "reserveHeadcount" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contact" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "nationalId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "bankName" TEXT,
    "bankAccountType" TEXT,
    "bankAccountNo" TEXT,
    "emergencyContact" TEXT,
    "workplace" TEXT,
    "contactPhone" TEXT,
    "note" TEXT,
    "photoPath" TEXT,
    "signaturePath" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant" (
    "id" SERIAL NOT NULL,
    "appliedAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" TEXT,
    "expectedSalary" DECIMAL(12,2),
    "fullNameTh" TEXT NOT NULL,
    "fullNameEn" TEXT,
    "nationalId" TEXT,
    "idCardIssuedAt" DATE,
    "idCardExpiresAt" DATE,
    "birthDate" DATE,
    "weightKg" DECIMAL(5,1),
    "heightCm" DECIMAL(5,1),
    "ethnicity" TEXT,
    "nationality" TEXT,
    "religion" TEXT,
    "addressNo" TEXT,
    "moo" TEXT,
    "road" TEXT,
    "subdistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "homePhone" TEXT,
    "mobilePhone" TEXT,
    "livingWith" TEXT,
    "residencePhone" TEXT,
    "fatherName" TEXT,
    "fatherOccupation" TEXT,
    "motherName" TEXT,
    "motherOccupation" TEXT,
    "siblingsCount" INTEGER,
    "birthOrder" INTEGER,
    "maritalStatus" TEXT,
    "spouseName" TEXT,
    "spousePhone" TEXT,
    "childrenCount" INTEGER,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "pregnancyMonths" INTEGER,
    "militaryStatus" TEXT,
    "educationLevel" TEXT,
    "lastInstitution" TEXT,
    "institutionProvince" TEXT,
    "gpa" DECIMAL(3,2),
    "major" TEXT,
    "graduationYear" TEXT,
    "languageSkills" TEXT,
    "languageDetail" TEXT,
    "thaiTypingWpm" INTEGER,
    "englishTypingWpm" INTEGER,
    "canUseWord" BOOLEAN NOT NULL DEFAULT false,
    "canUseExcel" BOOLEAN NOT NULL DEFAULT false,
    "canUsePowerpoint" BOOLEAN NOT NULL DEFAULT false,
    "otherComputerSkills" TEXT,
    "hasMotorcycleLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasCarLicense" BOOLEAN NOT NULL DEFAULT false,
    "carLicenseType" TEXT,
    "licenseIssuedAt" DATE,
    "licenseExpiresAt" DATE,
    "lastEmployer" TEXT,
    "lastPosition" TEXT,
    "lastSalary" DECIMAL(12,2),
    "lastWorkDuration" TEXT,
    "leavingReason" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelation" TEXT,
    "emergencyContactPhone" TEXT,
    "jobSource" TEXT,
    "hasCriminalRecord" BOOLEAN NOT NULL DEFAULT false,
    "criminalRecordDetail" TEXT,
    "consentCriminalCheck" TEXT,
    "consentHealthCheck" TEXT,
    "consentIdentity" TEXT,
    "consentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_check" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "checkedById" INTEGER,
    "checkedAt" DATE,
    "hasPhoto" BOOLEAN NOT NULL DEFAULT false,
    "hasIdCard" BOOLEAN NOT NULL DEFAULT false,
    "hasHouseRegistration" BOOLEAN NOT NULL DEFAULT false,
    "hasEducationCert" BOOLEAN NOT NULL DEFAULT false,
    "hasCarLicense" BOOLEAN NOT NULL DEFAULT false,
    "carLicenseType" TEXT,
    "hasMotorcycleLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasDisabilityCard" BOOLEAN NOT NULL DEFAULT false,
    "hasMilitaryDoc" BOOLEAN NOT NULL DEFAULT false,
    "hasOther" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_attachment" (
    "id" SERIAL NOT NULL,
    "documentCheckId" INTEGER NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "filePath" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview" (
    "id" SERIAL NOT NULL,
    "documentCheckId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "staffId" INTEGER,
    "interviewedAt" DATE,
    "result" TEXT,
    "resultReason" TEXT,
    "employmentStatus" TEXT,
    "wageRate" DECIMAL(12,2),
    "position" TEXT,
    "startDate" DATE,
    "probationStartDate" DATE,
    "probationEndDate" DATE,
    "probationDays" INTEGER,
    "evaluatedAt" DATE,
    "evaluationResult" TEXT,
    "comment" TEXT,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contract" (
    "id" SERIAL NOT NULL,
    "interviewId" INTEGER NOT NULL,
    "contractDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_check_authorization" (
    "id" SERIAL NOT NULL,
    "interviewId" INTEGER NOT NULL,
    "granteeName" TEXT,
    "granteeNationalId" TEXT,
    "granteeIdIssuedBy" TEXT,
    "granteeIdExpiresAt" DATE,
    "effectiveDate" DATE,
    "purpose" TEXT,
    "grantorIdIssuedBy" TEXT,
    "documentDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_check_authorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_referral_letter" (
    "id" SERIAL NOT NULL,
    "interviewId" INTEGER NOT NULL,
    "letterNo" TEXT,
    "documentDate" DATE,
    "addressedTo" TEXT,
    "issuedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_referral_letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_letter" (
    "id" SERIAL NOT NULL,
    "interviewId" INTEGER NOT NULL,
    "letterNo" TEXT,
    "documentDate" DATE,
    "addressedTo" TEXT,
    "issuedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guarantee_contract" (
    "id" SERIAL NOT NULL,
    "interviewId" INTEGER NOT NULL,
    "contractDate" DATE,
    "guarantorName" TEXT,
    "guarantorAge" INTEGER,
    "guarantorNationalId" TEXT,
    "addressNo" TEXT,
    "moo" TEXT,
    "road" TEXT,
    "subdistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "guarantorPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarantee_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT DEFAULT 'viewer',
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_code_key" ON "company"("code");

-- CreateIndex
CREATE INDEX "customer_companyId_idx" ON "customer"("companyId");

-- CreateIndex
CREATE INDEX "customer_contact_customerId_idx" ON "customer_contact"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_code_key" ON "staff"("code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

-- CreateIndex
CREATE INDEX "applicant_fullNameTh_idx" ON "applicant"("fullNameTh");

-- CreateIndex
CREATE INDEX "applicant_nationalId_idx" ON "applicant"("nationalId");

-- CreateIndex
CREATE INDEX "document_check_applicantId_idx" ON "document_check"("applicantId");

-- CreateIndex
CREATE INDEX "document_check_checkedById_idx" ON "document_check"("checkedById");

-- CreateIndex
CREATE INDEX "document_attachment_documentCheckId_idx" ON "document_attachment"("documentCheckId");

-- CreateIndex
CREATE INDEX "interview_documentCheckId_idx" ON "interview"("documentCheckId");

-- CreateIndex
CREATE INDEX "interview_customerId_idx" ON "interview"("customerId");

-- CreateIndex
CREATE INDEX "interview_staffId_idx" ON "interview"("staffId");

-- CreateIndex
CREATE INDEX "interview_interviewedAt_idx" ON "interview"("interviewedAt");

-- CreateIndex
CREATE INDEX "employment_contract_interviewId_idx" ON "employment_contract"("interviewId");

-- CreateIndex
CREATE INDEX "background_check_authorization_interviewId_idx" ON "background_check_authorization"("interviewId");

-- CreateIndex
CREATE INDEX "interview_referral_letter_interviewId_idx" ON "interview_referral_letter"("interviewId");

-- CreateIndex
CREATE INDEX "assignment_letter_interviewId_idx" ON "assignment_letter"("interviewId");

-- CreateIndex
CREATE INDEX "guarantee_contract_interviewId_idx" ON "guarantee_contract"("interviewId");

-- CreateIndex
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_check" ADD CONSTRAINT "document_check_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_check" ADD CONSTRAINT "document_check_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachment" ADD CONSTRAINT "document_attachment_documentCheckId_fkey" FOREIGN KEY ("documentCheckId") REFERENCES "document_check"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_documentCheckId_fkey" FOREIGN KEY ("documentCheckId") REFERENCES "document_check"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contract" ADD CONSTRAINT "employment_contract_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_check_authorization" ADD CONSTRAINT "background_check_authorization_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_referral_letter" ADD CONSTRAINT "interview_referral_letter_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_referral_letter" ADD CONSTRAINT "interview_referral_letter_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_letter" ADD CONSTRAINT "assignment_letter_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_letter" ADD CONSTRAINT "assignment_letter_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantee_contract" ADD CONSTRAINT "guarantee_contract_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
