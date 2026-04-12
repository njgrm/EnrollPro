import { useFormContext } from "react-hook-form";
import type { EarlyRegFormData } from "../types";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import { AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import { Controller } from "react-hook-form";

interface LegalConsentStepProps {
  isSubmitting: boolean;
}

export default function LegalConsentStep({
  isSubmitting,
}: LegalConsentStepProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<EarlyRegFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Data Privacy Consent
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          As required by Republic Act No. 10173 (Data Privacy Act of 2012)
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 max-h-60 overflow-y-auto text-sm leading-relaxed space-y-3">
        <p>
          I hereby authorize the Department of Education (DepEd) and its partner
          institutions to collect, process, and store the personal information
          provided in this form for the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            Early registration and enrollment processing for the school year
          </li>
          <li>Generation of the Learner Information System (LIS) records</li>
          <li>Statistical reporting and planning for educational services</li>
          <li>
            Provision of social services, scholarship referrals, and learning
            support programs
          </li>
        </ul>
        <p>
          I understand that my child&apos;s/ward&apos;s personal information
          will be handled in accordance with the Data Privacy Act of 2012 (RA
          10173) and its Implementing Rules and Regulations, and that I may
          exercise my rights as a data subject at any time.
        </p>
        <p>
          I certify that all information provided in this form is true and
          correct to the best of my knowledge.
        </p>
      </div>

      <Controller
        control={control}
        name="isPrivacyConsentGiven"
        render={({ field }) => (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Switch
                id="isPrivacyConsentGiven"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor="isPrivacyConsentGiven"
                className="cursor-pointer text-sm font-medium leading-snug">
                I have read and agree to the Data Privacy Notice above, and I
                certify that all information provided is true and correct.{" "}
                <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.isPrivacyConsentGiven?.message && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.isPrivacyConsentGiven.message}
              </p>
            )}
          </div>
        )}
      />

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit Early Registration"
        )}
      </Button>
    </div>
  );
}
