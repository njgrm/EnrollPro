import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { sileo } from "sileo";
import api from "@/shared/api/axiosInstance";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";

type WalkInMode = "new-learner" | "transferee" | "pept" | "balik-aral";

interface GradeLevelOption {
  id: number;
  name: string;
}

interface WalkInFormState {
  lrn: string;
  firstName: string;
  lastName: string;
  middleName: string;
  extensionName: string;
  birthdate: string;
  sex: string;
  gradeLevelId: string;
  originSchoolName: string;
  peptCertificateNumber: string;
  peptPassingDate: string;
}

const WALK_IN_MODE_CONFIG: Record<
  WalkInMode,
  {
    title: string;
    description: string;
    learnerType: "NEW_ENROLLEE" | "TRANSFEREE" | "ALS" | "RETURNING";
  }
> = {
  "new-learner": {
    title: "Enrol New Learner (No existing LRN)",
    description:
      "Encode incoming learners with no existing LRN and route to section assignment after verification.",
    learnerType: "NEW_ENROLLEE",
  },
  transferee: {
    title: "Enrol Transferee (From another school)",
    description:
      "Input LRN first and run local lookup to prevent duplicate records before encoding.",
    learnerType: "TRANSFEREE",
  },
  pept: {
    title: "Enrol Accelerated / PEPT Passer",
    description:
      "Encode accelerated PEPT passers using certificate and assessment details.",
    learnerType: "ALS",
  },
  "balik-aral": {
    title: "Enrol Balik-Aral",
    description:
      "Encode returning learners and route them directly into enrollment processing.",
    learnerType: "RETURNING",
  },
};

function resolveWalkInMode(rawType: string | null): WalkInMode {
  if (
    rawType === "new-learner" ||
    rawType === "transferee" ||
    rawType === "pept" ||
    rawType === "balik-aral"
  ) {
    return rawType;
  }

  return "transferee";
}

const EMPTY_FORM_STATE: WalkInFormState = {
  lrn: "",
  firstName: "",
  lastName: "",
  middleName: "",
  extensionName: "",
  birthdate: "",
  sex: "",
  gradeLevelId: "",
  originSchoolName: "",
  peptCertificateNumber: "",
  peptPassingDate: "",
};

export default function WalkInEncoder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = useMemo(
    () => resolveWalkInMode(searchParams.get("type")),
    [searchParams],
  );
  const modeConfig = WALK_IN_MODE_CONFIG[mode];

  const [formData, setFormData] = useState<WalkInFormState>(EMPTY_FORM_STATE);
  const [gradeLevels, setGradeLevels] = useState<GradeLevelOption[]>([]);
  const [loadingGradeLevels, setLoadingGradeLevels] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string>("");
  const [existingLearnerFound, setExistingLearnerFound] = useState(false);

  useEffect(() => {
    void fetchGradeLevels();
  }, []);

  useEffect(() => {
    setFormData(EMPTY_FORM_STATE);
    setLookupMessage("");
    setExistingLearnerFound(false);
  }, [mode]);

  const fetchGradeLevels = async () => {
    setLoadingGradeLevels(true);
    try {
      const response = await api.get("/school-years/grade-levels");
      setGradeLevels(response.data.gradeLevels || response.data || []);
    } catch (error) {
      toastApiError(error as never);
    } finally {
      setLoadingGradeLevels(false);
    }
  };

  const updateFormField = (field: keyof WalkInFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateUppercaseField = (
    field: keyof WalkInFormState,
    value: string,
  ) => {
    updateFormField(field, value.toUpperCase());
  };

  const handleLrnLookup = async () => {
    if (!/^\d{12}$/.test(formData.lrn.trim())) {
      sileo.error({
        title: "Invalid LRN",
        description: "Transferee lookup requires a 12-digit LRN.",
      });
      return;
    }

    setLookupLoading(true);
    setLookupMessage("");
    setExistingLearnerFound(false);

    try {
      const response = await api.get(
        `/applications/lookup-lrn/${formData.lrn.trim()}`,
      );
      const matched = response.data;

      setFormData((prev) => ({
        ...prev,
        lrn: String(matched.lrn ?? prev.lrn),
        firstName: String(matched.firstName ?? prev.firstName).toUpperCase(),
        lastName: String(matched.lastName ?? prev.lastName).toUpperCase(),
        middleName: String(matched.middleName ?? prev.middleName).toUpperCase(),
        extensionName: String(
          matched.extensionName ?? prev.extensionName,
        ).toUpperCase(),
        birthdate: matched.birthdate
          ? new Date(String(matched.birthdate)).toISOString().slice(0, 10)
          : prev.birthdate,
        sex: String(matched.sex ?? prev.sex),
        gradeLevelId:
          matched.gradeLevel != null
            ? String(matched.gradeLevel)
            : prev.gradeLevelId,
      }));

      setExistingLearnerFound(true);
      setLookupMessage(
        "Existing learner record found in the active school year. Use the existing record to avoid duplicates.",
      );
    } catch {
      setLookupMessage(
        "No existing eligible local record found for this LRN. Continue manual encoding.",
      );
      setExistingLearnerFound(false);
    } finally {
      setLookupLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      sileo.error({
        title: "Missing Name",
        description: "First name and last name are required.",
      });
      return false;
    }

    if (!formData.birthdate || !formData.sex || !formData.gradeLevelId) {
      sileo.error({
        title: "Missing Required Fields",
        description: "Birthdate, sex, and grade level are required.",
      });
      return false;
    }

    if (mode === "transferee") {
      if (!/^\d{12}$/.test(formData.lrn.trim())) {
        sileo.error({
          title: "LRN Required",
          description: "Transferee encoding requires a 12-digit LRN.",
        });
        return false;
      }

      if (!formData.originSchoolName.trim()) {
        sileo.error({
          title: "Origin School Required",
          description: "Provide origin school name for transferees.",
        });
        return false;
      }

      if (existingLearnerFound) {
        sileo.error({
          title: "Duplicate Prevention Triggered",
          description:
            "Existing learner detected. Open Enrollment queue instead of creating a duplicate.",
        });
        return false;
      }
    }

    if (mode === "pept") {
      if (!formData.peptCertificateNumber.trim() || !formData.peptPassingDate) {
        sileo.error({
          title: "PEPT Details Required",
          description:
            "Certificate number and date of assessment are required for PEPT passers.",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        lrn: formData.lrn.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim() || undefined,
        extensionName: formData.extensionName.trim() || undefined,
        birthdate: formData.birthdate,
        sex: formData.sex,
        learnerType: modeConfig.learnerType,
        applicantType: "REGULAR",
        gradeLevelId: Number(formData.gradeLevelId),
        academicStatus: "PROMOTED",
        originSchoolName: formData.originSchoolName.trim() || undefined,
        peptCertificateNumber:
          formData.peptCertificateNumber.trim() || undefined,
        peptPassingDate: formData.peptPassingDate || undefined,
      };

      const response = await api.post(
        "/applications/special-enrollment",
        payload,
      );
      const trackingHint = String(
        response.data?.trackingNumber ||
          `${formData.lastName} ${formData.firstName}`,
      ).trim();

      sileo.success({
        title: "Walk-in Saved",
        description:
          "Learner routed to Section Assignment queue as verified walk-in enrollment.",
      });

      navigate(
        `/monitoring/enrollment?workflow=SECTION_ASSIGNMENT&search=${encodeURIComponent(trackingHint)}`,
      );
    } catch (error) {
      toastApiError(error as never);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-2 py-6 sm:px-4 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          className="h-9 text-xs font-bold"
          onClick={() => navigate("/monitoring/enrollment")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Enrollment
        </Button>
        <Badge variant="secondary" className="text-[11px] font-bold">
          Admin Walk-In Encoder
        </Badge>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-bold">
            {modeConfig.title}
          </CardTitle>
          <p className="text-xs font-semibold text-muted-foreground">
            {modeConfig.description}
          </p>
          <p className="text-xs font-semibold text-primary">
            Save and Submit routes directly to Section Assignment for immediate
            section tagging.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "transferee" && (
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">
                  Transferee LRN Lookup
                </CardTitle>
                <p className="text-xs font-semibold text-muted-foreground">
                  Enter LRN first and check local records before creating a new
                  walk-in entry.
                </p>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label
                    htmlFor="lookupLrn"
                    className="text-[11px] font-bold uppercase tracking-wider">
                    LRN
                  </Label>
                  <Input
                    id="lookupLrn"
                    value={formData.lrn}
                    maxLength={12}
                    placeholder="Enter 12-digit LRN"
                    className="h-10 font-bold"
                    onChange={(event) => {
                      const nextValue = event.target.value
                        .replace(/[^\d]/g, "")
                        .slice(0, 12);
                      updateFormField("lrn", nextValue);
                      setExistingLearnerFound(false);
                      setLookupMessage("");
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 self-end text-xs font-bold"
                  disabled={lookupLoading}
                  onClick={() => {
                    void handleLrnLookup();
                  }}>
                  {lookupLoading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Lookup LRN
                </Button>
                {lookupMessage && (
                  <p className="sm:col-span-2 text-xs font-semibold text-muted-foreground">
                    {lookupMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-[11px] font-bold uppercase tracking-wider">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(event) => {
                  updateUppercaseField("lastName", event.target.value);
                }}
                placeholder="LAST NAME"
                className="h-10 font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-[11px] font-bold uppercase tracking-wider">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(event) => {
                  updateUppercaseField("firstName", event.target.value);
                }}
                placeholder="FIRST NAME"
                className="h-10 font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="middleName"
                className="text-[11px] font-bold uppercase tracking-wider">
                Middle Name
              </Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(event) => {
                  updateUppercaseField("middleName", event.target.value);
                }}
                placeholder="MIDDLE NAME"
                className="h-10 font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="extensionName"
                className="text-[11px] font-bold uppercase tracking-wider">
                Extension Name
              </Label>
              <Input
                id="extensionName"
                value={formData.extensionName}
                onChange={(event) => {
                  updateUppercaseField("extensionName", event.target.value);
                }}
                placeholder="JR / SR / III"
                className="h-10 font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="birthdate"
                className="text-[11px] font-bold uppercase tracking-wider">
                Birthdate *
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={(event) => {
                  updateFormField("birthdate", event.target.value);
                }}
                className="h-10 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="sex"
                className="text-[11px] font-bold uppercase tracking-wider">
                Sex *
              </Label>
              <Select
                value={formData.sex}
                onValueChange={(value) => {
                  updateFormField("sex", value);
                }}>
                <SelectTrigger id="sex" className="h-10 font-bold">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="gradeLevelId"
                className="text-[11px] font-bold uppercase tracking-wider">
                Grade to Enrol *
              </Label>
              <Select
                value={formData.gradeLevelId}
                onValueChange={(value) => {
                  updateFormField("gradeLevelId", value);
                }}
                disabled={loadingGradeLevels}>
                <SelectTrigger id="gradeLevelId" className="h-10 font-bold">
                  <SelectValue
                    placeholder={
                      loadingGradeLevels
                        ? "Loading grade levels..."
                        : "Select grade"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((gradeLevel) => (
                    <SelectItem
                      key={gradeLevel.id}
                      value={String(gradeLevel.id)}>
                      {gradeLevel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lrn"
                className="text-[11px] font-bold uppercase tracking-wider">
                LRN {mode === "transferee" ? "*" : "(Optional)"}
              </Label>
              <Input
                id="lrn"
                value={formData.lrn}
                maxLength={12}
                placeholder={
                  mode === "new-learner"
                    ? "Leave blank if no LRN"
                    : "12-digit LRN"
                }
                disabled={mode === "transferee"}
                className="h-10 font-bold"
                onChange={(event) => {
                  const nextValue = event.target.value
                    .replace(/[^\d]/g, "")
                    .slice(0, 12);
                  updateFormField("lrn", nextValue);
                }}
              />
            </div>
          </div>

          {mode === "transferee" && (
            <div className="space-y-2">
              <Label
                htmlFor="originSchoolName"
                className="text-[11px] font-bold uppercase tracking-wider">
                Origin School Name *
              </Label>
              <Input
                id="originSchoolName"
                value={formData.originSchoolName}
                onChange={(event) => {
                  updateUppercaseField("originSchoolName", event.target.value);
                }}
                placeholder="ENTER ORIGIN SCHOOL"
                className="h-10 font-bold uppercase"
              />
            </div>
          )}

          {mode === "pept" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="peptCertificateNumber"
                  className="text-[11px] font-bold uppercase tracking-wider">
                  PEPT Certificate Number *
                </Label>
                <Input
                  id="peptCertificateNumber"
                  value={formData.peptCertificateNumber}
                  onChange={(event) => {
                    updateUppercaseField(
                      "peptCertificateNumber",
                      event.target.value,
                    );
                  }}
                  placeholder="CERTIFICATE NUMBER"
                  className="h-10 font-bold uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="peptPassingDate"
                  className="text-[11px] font-bold uppercase tracking-wider">
                  Date of Assessment *
                </Label>
                <Input
                  id="peptPassingDate"
                  type="date"
                  value={formData.peptPassingDate}
                  onChange={(event) => {
                    updateFormField("peptPassingDate", event.target.value);
                  }}
                  className="h-10 font-bold"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-bold"
              onClick={() => navigate("/monitoring/enrollment")}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 px-6 text-xs font-bold"
              disabled={submitting}
              onClick={() => {
                void handleSubmit();
              }}>
              {submitting ? "Saving..." : "Save & Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
