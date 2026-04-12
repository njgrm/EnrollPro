import { z } from "zod";
import {
  SexEnum,
  EarlyRegGradeLevelEnum,
  LearnerTypeEnum,
  DisabilityTypeEnum,
} from "../constants/index.js";

// ─── DO 017 s.2025 — Basic Education Early Registration ─

/** Guardian sub-schema (father / mother / legal guardian row) */
export const earlyRegGuardianSchema = z.object({
  lastName: z.string().min(1, "Last name is required").max(100),
  firstName: z.string().min(1, "First name is required").max(100),
  middleName: z.string().max(100).optional().nullable(),
  contactNumber: z.string().max(20).optional().nullable(),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/** Optional guardian — all fields optional */
const optionalGuardianSchema = z.object({
  lastName: z.string().max(100).optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  middleName: z.string().max(100).optional().nullable(),
  contactNumber: z.string().max(20).optional().nullable(),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * Full early-registration submission schema.
 * Maps 1-to-1 with the DepEd Basic Education Early Registration Form
 * per DO 017, s. 2025 (Grades 7-10, Public JHS).
 */
export const earlyRegistrationSubmitSchema = z
  .object({
    // ── Registration ──────────────────────────────────────
    schoolYear: z.string().min(1, "School year is required"),
    gradeLevel: EarlyRegGradeLevelEnum,
    lrn: z
      .string()
      .regex(/^\d{12}$/, "LRN must be exactly 12 numeric digits")
      .optional()
      .nullable()
      .or(z.literal("")),
    learnerType: LearnerTypeEnum,

    // ── Personal ──────────────────────────────────────────
    lastName: z.string().min(1, "Last name is required").max(100),
    firstName: z.string().min(1, "First name is required").max(100),
    middleName: z.string().max(100).optional().nullable(),
    extensionName: z.string().max(20).optional().nullable(),
    birthdate: z.string().or(z.date()),
    sex: SexEnum,
    religion: z.string().max(100).optional().nullable(),

    // ── IP / PWD ──────────────────────────────────────────
    isIpCommunity: z.boolean().default(false),
    ipGroupName: z.string().max(100).optional().nullable(),
    isLearnerWithDisability: z.boolean().default(false),
    disabilityTypes: z.array(DisabilityTypeEnum).optional().nullable(),

    // ── Address ───────────────────────────────────────────
    houseNoStreet: z.string().max(200).optional().nullable(),
    sitio: z.string().max(100).optional().nullable(),
    barangay: z.string().min(1, "Barangay is required").max(100),
    cityMunicipality: z
      .string()
      .min(1, "City/Municipality is required")
      .max(100),
    province: z.string().min(1, "Province is required").max(100),

    // ── Guardians ─────────────────────────────────────────
    father: optionalGuardianSchema.optional().nullable(),
    mother: optionalGuardianSchema.optional().nullable(),
    guardian: optionalGuardianSchema.optional().nullable(),
    guardianRelationship: z.string().max(50).optional().nullable(),
    contactNumber: z
      .string()
      .min(1, "Contact number is required")
      .regex(
        /^(09\d{9}|(\+63)\d{10})$/,
        "Enter a valid PH mobile number (e.g. 09171234567)",
      ),
    email: z
      .string()
      .email("Invalid email")
      .optional()
      .nullable()
      .or(z.literal("")),

    // ── Legal / Privacy ───────────────────────────────────
    isPrivacyConsentGiven: z.boolean().refine((v) => v === true, {
      message: "You must consent to the Data Privacy Act (RA 10173)",
    }),
  })
  .superRefine((data, ctx) => {
    // LRN required for returning learners (Grades 8-10)
    const grade = parseInt(data.gradeLevel, 10);
    if (grade >= 8) {
      const lrn = data.lrn?.trim();
      if (!lrn) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "LRN is required for Grade 8-10 learners",
          path: ["lrn"],
        });
      }
    }

    // At least one parent/guardian must be provided
    const hasFather = data.father?.lastName && data.father?.firstName;
    const hasMother = data.mother?.lastName && data.mother?.firstName;
    const hasGuardian = data.guardian?.lastName && data.guardian?.firstName;
    if (!hasFather && !hasMother && !hasGuardian) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one parent or guardian must be provided",
        path: ["father"],
      });
    }

    // Guardian relationship required when guardian is provided
    if (hasGuardian && !data.guardianRelationship?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Guardian relationship is required",
        path: ["guardianRelationship"],
      });
    }

    // IP group name required when IP community flag is true
    if (data.isIpCommunity && !data.ipGroupName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Specify the IP group/ethnicity name",
        path: ["ipGroupName"],
      });
    }

    // Disability types required when PWD flag is true
    if (
      data.isLearnerWithDisability &&
      (!data.disabilityTypes || data.disabilityTypes.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Specify at least one disability type",
        path: ["disabilityTypes"],
      });
    }
  });
