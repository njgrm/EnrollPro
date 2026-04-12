import { useFormContext } from "react-hook-form";
import type { EarlyRegFormData } from "../types";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { AlertCircle } from "lucide-react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

export default function AddressGuardianStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EarlyRegFormData>();

  return (
    <div className="space-y-8">
      {/* ─── Address Section ─── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Home Address</h2>
          <p className="text-sm text-muted-foreground">
            Current residential address of the learner
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="houseNoStreet">House No. / Street</Label>
            <Input
              id="houseNoStreet"
              {...register("houseNoStreet")}
              placeholder="e.g. 123 Rizal St."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sitio">Sitio / Purok</Label>
            <Input
              id="sitio"
              {...register("sitio")}
              placeholder="e.g. Purok 3"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barangay">
              Barangay <span className="text-destructive">*</span>
            </Label>
            <Input
              id="barangay"
              {...register("barangay")}
              placeholder="Barangay name"
            />
            <FieldError message={errors.barangay?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cityMunicipality">
              City / Municipality <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cityMunicipality"
              {...register("cityMunicipality")}
              placeholder="City or Municipality"
            />
            <FieldError message={errors.cityMunicipality?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">
              Province <span className="text-destructive">*</span>
            </Label>
            <Input
              id="province"
              {...register("province")}
              placeholder="Province"
            />
            <FieldError message={errors.province?.message} />
          </div>
        </div>
      </div>

      {/* ─── Father Section ─── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Father&apos;s Name</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="father.lastName">Last Name</Label>
            <Input
              id="father.lastName"
              {...register("father.lastName")}
              placeholder="Last name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="father.firstName">First Name</Label>
            <Input
              id="father.firstName"
              {...register("father.firstName")}
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="father.middleName">Middle Name</Label>
            <Input
              id="father.middleName"
              {...register("father.middleName")}
              placeholder="Middle name"
            />
          </div>
        </div>
      </div>

      {/* ─── Mother Section ─── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Mother&apos;s Maiden Name</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mother.lastName">Last Name</Label>
            <Input
              id="mother.lastName"
              {...register("mother.lastName")}
              placeholder="Last name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mother.firstName">First Name</Label>
            <Input
              id="mother.firstName"
              {...register("mother.firstName")}
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mother.middleName">Middle Name</Label>
            <Input
              id="mother.middleName"
              {...register("mother.middleName")}
              placeholder="Middle name"
            />
          </div>
        </div>
      </div>

      {/* ─── Guardian Section ─── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">
          Legal Guardian{" "}
          <span className="text-muted-foreground font-normal text-sm">
            (if different from parents)
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guardian.lastName">Last Name</Label>
            <Input
              id="guardian.lastName"
              {...register("guardian.lastName")}
              placeholder="Last name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian.firstName">First Name</Label>
            <Input
              id="guardian.firstName"
              {...register("guardian.firstName")}
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianRelationship">Relationship</Label>
            <Input
              id="guardianRelationship"
              {...register("guardianRelationship")}
              placeholder="e.g. Grandmother, Uncle"
            />
            <FieldError message={errors.guardianRelationship?.message} />
          </div>
        </div>
      </div>

      {/* ─── Contact Info ─── */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactNumber">
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactNumber"
              {...register("contactNumber")}
              placeholder="09171234567"
              inputMode="tel"
              maxLength={13}
            />
            <FieldError message={errors.contactNumber?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              {...register("email")}
              placeholder="parent@email.com"
              type="email"
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
      </div>

      {/* At-least-one-parent validation error */}
      {errors.father && (errors.father as { message?: string }).message && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {(errors.father as { message?: string }).message}
          </p>
        </div>
      )}
    </div>
  );
}
