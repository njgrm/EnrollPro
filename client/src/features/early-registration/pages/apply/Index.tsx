import { useState } from "react";
import GuestLayout from "@/shared/layouts/GuestLayout";
import EarlyRegistrationForm from "./EarlyRegistrationForm";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { useSettingsStore } from "@/store/settings.slice";

const CONSENT_KEY = "enrollpro_earlyreg_consent";

export default function EarlyRegistrationApply() {
  const [hasConsented, setHasConsented] = useState(
    () => sessionStorage.getItem(CONSENT_KEY) === "true",
  );
  const [successData, setSuccessData] = useState<{
    id: number;
    learnerName: string;
  } | null>(null);

  const { schoolName, enrollmentPhase } = useSettingsStore();
  const isClosed =
    enrollmentPhase !== "EARLY_REGISTRATION" && enrollmentPhase !== "OVERRIDE";

  const handleAccept = () => {
    sessionStorage.setItem(CONSENT_KEY, "true");
    setHasConsented(true);
  };

  const handleReset = () => {
    sessionStorage.removeItem(CONSENT_KEY);
    setHasConsented(false);
    setSuccessData(null);
  };

  return (
    <GuestLayout>
      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-6 px-4 text-center border-b bg-background/80 backdrop-blur">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            {schoolName || "School"} — DO 017 s.2025
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Basic Education Early Registration Form (Grades 7–10 JHS)
          </p>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col flex-1">
          <div className="w-full mx-auto max-w-3xl">
            {isClosed ? (
              <Card className="text-center py-12">
                <CardContent className="space-y-4">
                  <h2 className="text-xl font-bold">
                    Hindi pa bukas ang early registration. / Early registration
                    is not yet open.
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Mangyaring bumalik kapag nagsimula na ang panahon ng early
                    registration. / Please come back when the early registration
                    period begins.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="wait">
                {successData ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}>
                    <Card className="text-center py-12">
                      <CardContent className="space-y-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-xl font-bold">
                          Matagumpay ang Pag-register! / Registration
                          Successful!
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          Nai-submit na ang early registration ni{" "}
                          <span className="font-semibold text-foreground">
                            {successData.learnerName}
                          </span>
                          . Ang registration ID ay{" "}
                          <span className="font-mono font-bold text-foreground">
                            #{successData.id}
                          </span>
                          .
                        </p>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="mt-4">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Register Another Learner
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : !hasConsented ? (
                  <motion.div
                    key="consent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}>
                    <Card>
                      <CardContent className="p-6 md:p-10 space-y-6">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                          <div>
                            <h2 className="text-lg font-bold">
                              Abiso sa Privacy / Privacy Notice
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              Republic Act No. 10173 (Data Privacy Act of 2012)
                            </p>
                          </div>
                        </div>

                        <div className="text-sm leading-relaxed space-y-3 text-muted-foreground">
                          <p>
                            This form collects personal information for the
                            purpose of early registration as mandated by DepEd
                            Order No. 017, s. 2025. All data collected will be
                            handled in accordance with the Data Privacy Act of
                            2012 (RA 10173).
                          </p>
                          <p>
                            Information gathered will be used exclusively for:
                            enrollment processing, Learner Information System
                            (LIS) records, statistical reporting, and provision
                            of educational support services.
                          </p>
                          <p>
                            By proceeding, you consent to the collection and
                            processing of the information provided in this form.
                          </p>
                        </div>

                        <Button
                          onClick={handleAccept}
                          className="w-full"
                          size="lg">
                          I Understand and Agree — Proceed to Registration
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}>
                    <EarlyRegistrationForm
                      onSuccess={(data) => setSuccessData(data)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </GuestLayout>
  );
}
