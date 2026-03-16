import { Check } from 'lucide-react';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: { id: number; title: string }[];
}

export default function StepProgressBar({ currentStep, totalSteps, steps }: StepProgressBarProps) {
  return (
    <div className="w-full mb-8">
      {/* Mobile View */}
      <div className="flex flex-col items-center gap-3 md:hidden py-4">
        <div className="flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: step.id === currentStep ? '2rem' : '0.75rem',
                backgroundColor:
                  step.id === currentStep
                    ? 'hsl(var(--accent-foreground))'
                    : step.id < currentStep
                    ? 'hsl(var(--accent-foreground) / 0.5)'
                    : 'hsl(var(--accent-foreground) / 0.2)',
              }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'hsl(var(--accent-foreground) / 0.5)' }}
          >
            Step {currentStep} of {totalSteps}
          </span>
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: 'hsl(var(--accent-foreground))' }}
          >
            {steps[currentStep - 1].title}
          </span>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block py-6 px-4">
        <div className="relative flex items-start justify-between">
          {/* Track */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: '1.25rem',
              backgroundColor: 'hsl(var(--accent-foreground) / 0.15)',
            }}
          />
          {/* Progress fill */}
          <div
            className="absolute left-0 h-px transition-all duration-500 ease-in-out"
            style={{
              top: '1.25rem',
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              backgroundColor: 'hsl(var(--accent-foreground))',
            }}
          />

          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;

            return (
              <div key={step.id} className="relative flex flex-col items-center gap-3 z-10">
                {/* Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2"
                  style={{
                    backgroundColor: isCompleted
                      ? 'hsl(var(--accent-foreground))'
                      : isActive
                      ? 'hsl(var(--accent-foreground) / 0.12)'
                      : 'hsl(var(--accent) / 0.6)',
                    borderColor: isCompleted || isActive
                      ? 'hsl(var(--accent-foreground))'
                      : 'hsl(var(--accent-foreground) / 0.25)',
                    color: isCompleted
                      ? 'hsl(var(--accent))'
                      : isActive
                      ? 'hsl(var(--accent-foreground))'
                      : 'hsl(var(--accent-foreground) / 0.35)',
                    boxShadow: isActive
                      ? '0 0 0 4px hsl(var(--accent-foreground) / 0.12)'
                      : 'none',
                  }}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-3" /> : step.id}
                </div>

                {/* Label */}
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-center whitespace-nowrap"
                    style={{
                      color: isCompleted || isActive
                        ? 'hsl(var(--accent-foreground))'
                        : 'hsl(var(--accent-foreground) / 0.35)',
                    }}
                  >
                    {isCompleted ? 'Done' : isActive ? step.title : step.title}
                  </span>
                  {isActive && (
                    <div
                      className="h-0.5 w-4 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--accent-foreground))' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
