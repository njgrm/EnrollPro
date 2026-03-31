import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/shared/api/axiosInstance';
import { toastApiError } from '@/shared/hooks/useApiToast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { sileo } from 'sileo';
import type {
	ApplicantDetail,
	AssessmentStep,
} from '@/features/enrollment/hooks/useApplicationDetail';
import { formatScpType } from '@/shared/lib/utils';
import { ASSESSMENT_KIND_LABELS } from '@enrollpro/shared';
import type { AssessmentKind } from '@enrollpro/shared';

interface ScpStepConfig {
	stepOrder: number;
	scheduledDate: string | null;
	scheduledTime: string | null;
	venue: string | null;
	notes: string | null;
}

interface ScpConfig {
	scpType: string;
	steps: ScpStepConfig[];
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	applicant: ApplicantDetail | null;
	/** The specific pipeline step to schedule. When null, falls back to legacy behavior. */
	step?: AssessmentStep | null;
	onSuccess: () => void;
	onCloseSheet?: () => void;
}

export function ScheduleExamDialog({
	open,
	onOpenChange,
	applicant,
	step,
	onSuccess,
	onCloseSheet,
}: Props) {
	const [scheduledDate, setScheduledDate] = useState('');
	const [scheduledTime, setScheduledTime] = useState('');
	const [venue, setVenue] = useState('');
	const [notes, setNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open || !applicant) return;

		if (step) {
			// Fetch fresh config defaults from the SCP assessment step table
			api
				.get(`/curriculum/${applicant.schoolYearId}/scp-config`)
				.then((res) => {
					const configs: ScpConfig[] = res.data?.scpConfigs ?? [];
					const match = configs.find(
						(c) => c.scpType === applicant.applicantType,
					);
					const stepConfig = match?.steps?.find(
						(s) => s.stepOrder === step.stepOrder,
					);
					if (stepConfig) {
						setScheduledDate(
							stepConfig.scheduledDate
								? format(new Date(stepConfig.scheduledDate), 'yyyy-MM-dd')
								: '',
						);
						setScheduledTime(stepConfig.scheduledTime || '');
						setVenue(stepConfig.venue || '');
						setNotes(stepConfig.notes || '');
					} else {
						// Fallback to step prop data
						setScheduledDate(
							step.configDate
								? format(new Date(step.configDate), 'yyyy-MM-dd')
								: '',
						);
						setScheduledTime(step.configTime || '');
						setVenue(step.configVenue || '');
						setNotes(step.configNotes || '');
					}
				})
				.catch(() => {
					// Fallback to step prop data on error
					setScheduledDate(
						step.configDate
							? format(new Date(step.configDate), 'yyyy-MM-dd')
							: '',
					);
					setScheduledTime(step.configTime || '');
					setVenue(step.configVenue || '');
					setNotes(step.configNotes || '');
				});
		} else {
			setScheduledDate('');
			setScheduledTime('');
			setVenue('');
			setNotes('');
		}
	}, [open, step, applicant]);

	if (!applicant) return null;

	const stepLabel = step
		? step.label ||
			ASSESSMENT_KIND_LABELS[step.kind as AssessmentKind] ||
			step.kind
		: 'Assessment';

	const handleSchedule = async () => {
		if (!scheduledDate) return;
		setSubmitting(true);
		try {
			if (step) {
				// Pipeline-aware endpoint
				await api.patch(`/applications/${applicant.id}/schedule-assessment`, {
					stepOrder: step.stepOrder,
					kind: step.kind,
					scheduledDate,
					scheduledTime: scheduledTime || undefined,
					venue: venue || undefined,
					notes: notes || undefined,
				});
			} else {
				// Legacy fallback
				await api.patch(`/applications/${applicant.id}/schedule-exam`, {
					examDate: scheduledDate,
					examTime: scheduledTime || undefined,
				});
			}
			sileo.success({
				title: 'Scheduled',
				description: `${stepLabel} scheduled successfully.`,
			});
			onOpenChange(false);
			onSuccess();
			if (onCloseSheet) onCloseSheet();
		} catch (err) {
			toastApiError(err as never);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className='max-w-2xl sm:w-full overflow-y-auto max-h-[90vh] scrollbar-thin'>
				<DialogHeader>
					<DialogTitle className='font-bold uppercase'>
						Schedule {stepLabel}
					</DialogTitle>
					<DialogDescription className='font-bold text-foreground'>
						Applicant: {applicant.lastName}, {applicant.firstName} (
						{applicant.gradeLevel.name} -{' '}
						{formatScpType(applicant.applicantType)})
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					{step && (
						<div className='rounded-lg border p-3 bg-slate-50 space-y-1'>
							<div className='flex items-center gap-2 font-bold text-sm'>
								<span className='text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full'>
									Step {step.stepOrder}
								</span>
								<span>{stepLabel}</span>
							</div>
							{step.description && (
								<p className='text-xs text-muted-foreground'>
									{step.description}
								</p>
							)}
						</div>
					)}

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label className='font-semibold'>Date</Label>
							<Input
								type='date'
								value={scheduledDate}
								onChange={(e) => setScheduledDate(e.target.value)}
							/>
							{scheduledDate && (
								<p className='text-[0.625rem] text-muted-foreground'>
									{format(new Date(scheduledDate), 'MMMM dd, yyyy')}
								</p>
							)}
						</div>
						<div className='space-y-2'>
							<Label className='font-semibold'>Time</Label>
							<Input
								type='time'
								value={scheduledTime}
								onChange={(e) => setScheduledTime(e.target.value)}
							/>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label className='font-semibold'>Venue</Label>
							<Input
								placeholder='e.g. Science Lab, Room 201'
								value={venue}
								onChange={(e) => setVenue(e.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label className='font-semibold'>Notes</Label>
							<Input
								placeholder='Additional instructions...'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>
					</div>

					<Alert className='flex items-center bg-primary/5 border-primary/20 p-3 gap-3 min-h-0 [&>svg]:static [&>svg]:translate-y-0'>
						<Info className='h-4 w-4 stroke-primary shrink-0' />
						<AlertDescription className='!p-0 !m-0 !translate-y-0 font-bold text-primary/80 text-xs leading-tight'>
							A confirmation email will be sent to the parent/guardian at{' '}
							<span className='font-bold underline text-primary'>
								{applicant.emailAddress || 'N/A'}
							</span>{' '}
							with the schedule details.
						</AlertDescription>
					</Alert>
				</div>

				<DialogFooter>
					<Button
						className='font-bold'
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						className='font-bold'
						onClick={handleSchedule}
						disabled={!scheduledDate || submitting}
					>
						Confirm Schedule
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
