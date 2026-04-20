import { defineStepper } from "@stepperize/react";
import type { StepperReturn } from "@stepperize/react";
import type {
  Metadata,
  StepStatus,
  Stepper as StepperCore,
} from "@stepperize/core";

const stepper = defineStepper(
  {
    id: "basic-info",
    title: "Basic Information",
    description:
      "School Year, learner category, Grade Level, LRN, and learning program",
  },
  {
    id: "learner-profile",
    title: "Learner Profile",
    description: "Name, birthdate, sex at birth, and IP/PWD details",
  },
  {
    id: "address-guardian",
    title: "Address and Contact",
    description: "Home address, parent/guardian details, and contact person",
  },
  {
    id: "legal-consent",
    title: "Review and Submit",
    description: "Final review, certification, and submission",
  },
);

type MySteps = typeof stepper.steps;

export const useStepper: StepperReturn<MySteps>["useStepper"] =
  stepper.useStepper;
export const steps: MySteps = stepper.steps;
export const Stepper: StepperReturn<MySteps>["Stepper"] = stepper.Stepper;
export const Scoped: StepperReturn<MySteps>["Scoped"] = stepper.Scoped;

// Re-export types to satisfy portability and ensure they are reachable if needed
export type { Metadata, StepStatus, StepperCore };
