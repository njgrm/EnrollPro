import { useState, useEffect } from 'react';
import { useForm, FormProvider, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { admissionSchema, type AdmissionFormData } from './types';
import Step1Personal from './components/Step1Personal';
import Step2Family from './components/Step2Family';
import Step3Background from './components/Step3Background';
import Step4PreviousSchool from './components/Step4PreviousSchool';
import Step5Enrollment from './components/Step5Enrollment';
import Step6Review from './components/Step6Review';
import AdmissionSuccess from './components/AdmissionSuccess';
import StepProgressBar from './components/StepProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Personal Info', description: 'Basic details & reference numbers' },
  { id: 2, title: 'Family & Contact', description: 'Who do we contact?' },
  { id: 3, title: 'Background', description: 'A few more details' },
  { id: 4, title: 'Previous School', description: 'Where did you study last?' },
  { id: 5, title: 'Preferences', description: 'What are you applying for?' },
  { id: 6, title: 'Review & Submit', description: 'Check everything before submitting' },
];

const generateTrackingNumber = () => {
  return `HNS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
};

export default function AdmissionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<AdmissionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(admissionSchema) as unknown as any,
    defaultValues: {
      schoolYear: '2026-2027',
      privacyConsentGiven: true,
      gradeLevel: '7',
      isIpCommunity: false,
      is4PsBeneficiary: false,
      isBalikAral: false,
      isLearnerWithDisability: false,
      isPermanentSameAsCurrent: true,
      scpApplication: false,
      learnerType: 'Regular',
      learningModality: 'Face-to-Face',
      isCertifiedTrue: true,
      dateAccomplished: new Date(),
    },
    mode: 'onBlur',
  });

  const { handleSubmit, trigger, getValues, reset } = methods;

  // Persistence logic
  useEffect(() => {
    const draft = sessionStorage.getItem('hnhs_apply_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.birthdate) parsed.birthdate = new Date(parsed.birthdate);
      if (parsed.dateAccomplished) parsed.dateAccomplished = new Date(parsed.dateAccomplished);
      reset(parsed);
    }
  }, [reset]);

  const saveDraft = () => {
    sessionStorage.setItem('hnhs_apply_draft', JSON.stringify(getValues()));
  };

  const nextStep = async () => {
    let fieldsToValidate: FieldPath<AdmissionFormData>[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['lastName', 'firstName', 'birthdate', 'sex', 'placeOfBirth', 'motherTongue'];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'currentAddress.barangay', 'currentAddress.cityMunicipality', 'currentAddress.province',
        'mother.lastName', 'mother.firstName', 'father.lastName', 'father.firstName', 'email'
      ] as FieldPath<AdmissionFormData>[];
    } else if (currentStep === 4) {
      fieldsToValidate = ['lastSchoolName', 'lastGradeCompleted', 'syLastAttended', 'lastSchoolType'];
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    
    if (isValid) {
      saveDraft();
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: AdmissionFormData) => {
    setIsSubmitting(true);
    console.log('Form Submitted:', data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setTrackingNumber(generateTrackingNumber());
    setIsSubmitted(true);
    setIsSubmitting(false);
    sessionStorage.removeItem('hnhs_apply_draft');
    sessionStorage.removeItem('hnhs_apply_consent');
  };

  if (isSubmitted) {
    return <AdmissionSuccess trackingNumber={trackingNumber} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-0">
      <StepProgressBar currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

      <Card className="shadow-sm border-border rounded-2xl overflow-hidden mb-12">
        <CardContent className="p-6 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-muted-foreground italic font-medium">
              "{STEPS[currentStep - 1].description}"
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {currentStep === 1 && <Step1Personal />}
                  {currentStep === 2 && <Step2Family />}
                  {currentStep === 3 && <Step3Background />}
                  {currentStep === 4 && <Step4PreviousSchool />}
                  {currentStep === 5 && <Step5Enrollment />}
                  {currentStep === 6 && <Step6Review onEdit={goToStep} />}
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-10 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className="h-12 px-8 font-semibold sm:w-auto w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                {currentStep < 6 ? (
                  <Button 
                    type="button" 
                    size="lg"
                    onClick={nextStep}
                    className="h-12 px-8 font-semibold sm:w-auto w-full"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={isSubmitting}
                    className="h-12 px-10 font-bold bg-primary hover:bg-primary/90 sm:w-auto w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-5 w-5 stroke-3" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
