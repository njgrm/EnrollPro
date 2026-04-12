import { defineStepper } from "@stepperize/react";

const stepper = defineStepper(
  {
    id: "basic-info",
    title: "Basic Information",
    description: "Grade Level and School Year",
  },
  {
    id: "learner-profile",
    title: "Learner Profile",
    description: "Name, Birthdate, Sex, IP/PWD status",
  },
  {
    id: "address-guardian",
    title: "Address & Guardian",
    description: "Home address and parent/guardian details",
  },
  {
    id: "legal-consent",
    title: "Data Privacy Consent",
    description: "RA 10173 compliance and submission",
  },
);

export const { useStepper, steps } = stepper;
