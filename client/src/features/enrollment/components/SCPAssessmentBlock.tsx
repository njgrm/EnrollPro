import { format } from 'date-fns';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import type { ApplicantDetail } from '@/features/enrollment/hooks/useApplicationDetail';
import { formatScpType } from '@/shared/lib/utils';
import { ASSESSMENT_KIND_LABELS } from '@enrollpro/shared';
import type { AssessmentKind } from '@enrollpro/shared';
import { Badge } from '@/shared/ui/badge';

interface Props {
	applicant: ApplicantDetail;
}

const STATUS_CONFIG = {
	COMPLETED: {
		icon: CheckCircle2,
		color: 'text-emerald-600',
		bg: 'bg-emerald-50',
		border: 'border-emerald-200',
		badge: 'bg-emerald-100 text-emerald-800',
		line: 'bg-emerald-300',
	},
	SCHEDULED: {
		icon: Clock,
		color: 'text-blue-600',
		bg: 'bg-blue-50',
		border: 'border-blue-200',
		badge: 'bg-blue-100 text-blue-800',
		line: 'bg-blue-300',
	},
	PENDING: {
		icon: Circle,
		color: 'text-muted-foreground',
		bg: 'bg-muted/30',
		border: 'border-border',
		badge: 'bg-muted text-muted-foreground',
		line: 'bg-border',
	},
} as const;

export function SCPAssessmentBlock({ applicant }: Props) {
	if (applicant.applicantType === 'REGULAR') return null;

	const steps = applicant.assessmentSteps;
	const hasSteps = steps && steps.length > 0;

	return (
		<div className='border border-primary/50 bg-primary/8 rounded-md p-3 mb-4 space-y-2'>
			<div className='flex items-center gap-2 font-bold border-b border-primary/50 pb-2 mb-2'>
				<span>&#9889;</span>
				<span>{formatScpType(applicant.applicantType)} Assessment</span>
				{hasSteps && (
					<span className='ml-auto text-xs text-muted-foreground font-bold'>
						{steps.filter((s) => s.status === 'COMPLETED').length}/
						{steps.length} completed
					</span>
				)}
			</div>

			{hasSteps ? (
				<div className='relative space-y-0'>
					{steps.map((step, idx) => {
						const cfg = STATUS_CONFIG[step.status];
						const Icon = cfg.icon;
						const isLast = idx === steps.length - 1;

						return (
							<div
								key={step.stepOrder}
								className='flex gap-3 pt-1'
							>
								{/* Vertical timeline */}
								<div className='flex flex-col items-center'>
									<Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
									{!isLast && (
										<div className={`w-0.5 flex-1 min-h-4 ${cfg.line}`} />
									)}
								</div>

								{/* Step content */}
								<div className={`flex-1 ${isLast ? '' : ''}`}>
									<div className='flex items-center gap-2 flex-wrap'>
										<span className='text-sm font-bold '>
											{step.label ||
												ASSESSMENT_KIND_LABELS[step.kind as AssessmentKind] ||
												step.kind}
										</span>
										<Badge
											variant='outline'
											className={`text-[0.6rem] px-1.5 py-0 h-4 font-bold ${cfg.badge}`}
										>
											{step.status}
										</Badge>
										{!step.isRequired && (
											<span className='text-[0.6rem] text-muted-foreground italic'>
												Optional
											</span>
										)}
									</div>

									{/* Details row */}
									<div className='text-xs text-muted-foreground mt-0.5 space-x-3'>
										{step.scheduledDate && (
											<span>
												{format(new Date(step.scheduledDate), 'MMM dd, yyyy')}
												{step.scheduledTime && ` at ${step.scheduledTime}`}
											</span>
										)}
										{step.venue && <span>@ {step.venue}</span>}
										{step.score !== null && (
											<span className='font-bold text-foreground'>
												Score: {step.score}
											</span>
										)}
										{step.result && (
											<span className='font-bold text-foreground uppercase'>
												{step.result}
											</span>
										)}
									</div>

									{step.notes && (
										<p className='text-xs italic text-muted-foreground mt-0.5'>
											{step.notes}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			) : (
				/* Fallback: legacy flat display for old data without pipeline steps */
				<div className='text-sm grid grid-cols-[110px_1fr] gap-1 font-bold'>
					<span>Type:</span>
					<span className='uppercase'>
						{applicant.assessmentType || 'Not specified'}
					</span>

					<span>Date:</span>
					<span className='uppercase'>
						{applicant.examDate
							? format(new Date(applicant.examDate), 'MMMM dd, yyyy')
							: 'Not yet scheduled'}
					</span>

					{applicant.examVenue && (
						<>
							<span>Venue:</span>
							<span className='uppercase'>{applicant.examVenue}</span>
						</>
					)}

					<span>Score/Result:</span>
					<span className='uppercase'>
						{applicant.examScore !== null
							? `${applicant.examScore} / 100`
							: applicant.examResult || '\u2014'}
					</span>

					{applicant.examNotes && (
						<>
							<span>Notes:</span>
							<span className='uppercase italic'>{applicant.examNotes}</span>
						</>
					)}
				</div>
			)}
		</div>
	);
}
