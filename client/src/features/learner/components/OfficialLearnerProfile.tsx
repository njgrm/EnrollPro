import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { LabelValuePair } from "@/features/learner/components/LabelValuePair";
import type { LearnerDashboardResponse } from "@/features/learner/types";

export interface OfficialLearnerProfileProps {
  data: LearnerDashboardResponse;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not Specified";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function OfficialLearnerProfile({ data }: OfficialLearnerProfileProps) {
  const [currentTimestamp] = useState(() => Date.now());
  const birthDate = data.sf1.birthdate ? new Date(data.sf1.birthdate) : null;
  const age =
    birthDate && !Number.isNaN(birthDate.getTime())
      ? `${Math.floor((currentTimestamp - birthDate.getTime()) / 31557600000)} years old`
      : null;

  const permanentAddressStr = data.sf1.permanentAddress
    ? [
        data.sf1.permanentAddress.houseNoStreet,
        data.sf1.permanentAddress.barangay,
        data.sf1.permanentAddress.cityMunicipality,
        data.sf1.permanentAddress.province,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  const currentAddressStr = data.sf1.currentAddress
    ? [
        data.sf1.currentAddress.houseNoStreet,
        data.sf1.currentAddress.barangay,
        data.sf1.currentAddress.cityMunicipality,
        data.sf1.currentAddress.province,
      ]
        .filter(Boolean)
        .join(", ")
    : permanentAddressStr
      ? "Same as Permanent Address"
      : null;

  const motherName = data.sf1.mother
    ? `${data.sf1.mother.firstName} ${data.sf1.mother.lastName}`.trim()
    : null;

  const fatherName = data.sf1.father
    ? `${data.sf1.father.firstName} ${data.sf1.father.lastName}`.trim()
    : null;

  const guardianName = data.sf1.guardian
    ? `${data.sf1.guardian.firstName} ${data.sf1.guardian.lastName}`.trim()
    : null;

  const ipStatus = data.sf1.isIpCommunity
    ? `Yes (${data.sf1.ipGroupName || "Not specified"})`
    : "No";

  const fourPsStatus = data.sf1.is4PsBeneficiary ? "Yes" : "No";

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-2">
        <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-primary dark:text-foreground">
          Official Learner Profile
        </h2>
      </div>

      {/* Container I: Learner Identity */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base sm:text-lg font-bold uppercase text-foreground">
            I. Learner Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <LabelValuePair
              label="Sex"
              value={data.sf1.sex?.toUpperCase() === "MALE" ? "Male" : "Female"}
            />
            <LabelValuePair
              label="Date of Birth"
              value={formatDate(data.sf1.birthdate)}
            />
            <LabelValuePair
              label="Place of Birth"
              value={data.sf1.placeOfBirth}
            />
            <LabelValuePair
              label="Age"
              value={age}
            />
            <LabelValuePair
              label="Religion"
              value={data.sf1.religion}
            />
            <LabelValuePair
              label="Mother Tongue"
              value={data.sf1.motherTongue}
            />
            <LabelValuePair
              label="IP Group Status"
              value={ipStatus}
            />
            <LabelValuePair
              label="4Ps Beneficiary"
              value={fourPsStatus}
            />
          </div>
        </CardContent>
      </Card>

      {/* Container II: Current Residency */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base sm:text-lg font-bold uppercase text-foreground">
            II. Current Residency
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LabelValuePair
              label="Permanent Home Address"
              value={permanentAddressStr}
            />
            <LabelValuePair
              label="Current Home Address"
              value={currentAddressStr}
            />
          </div>
        </CardContent>
      </Card>

      {/* Container III: Parent/Guardian Background */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50">
          <CardTitle className="text-base sm:text-lg font-bold uppercase text-foreground">
            III. Parent/Guardian Background
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <LabelValuePair
              label="Mother's Full Maiden Name"
              value={motherName}
            />
            <LabelValuePair
              label="Mother's Contact Number"
              value={data.sf1.mother?.contactNumber}
            />
            <LabelValuePair
              label="Father's Full Name"
              value={fatherName}
            />
            <LabelValuePair
              label="Father's Contact Number"
              value={data.sf1.father?.contactNumber}
            />
            {guardianName && (
              <>
                <LabelValuePair
                  label="Guardian's Full Name"
                  value={guardianName}
                />
                <LabelValuePair
                  label="Guardian's Contact Number"
                  value={data.sf1.guardian?.contactNumber}
                />
                <LabelValuePair
                  label="Relationship to Learner"
                  value={data.sf1.guardian?.relationship}
                />
              </>
            )}
            {data.sf1.is4PsBeneficiary && (
              <LabelValuePair
                label="4Ps Household Number"
                value={data.sf1.householdId4Ps}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
