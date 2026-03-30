import { useState } from 'react';
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
import { sileo } from 'sileo';
import type { ApplicantDetail } from '@/features/enrollment/hooks/useApplicationDetail';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	applicant: ApplicantDetail | null;
	onSuccess: () => void;
}

export function ScheduleInterviewDialog({
	open,
	onOpenChange,
	applicant,
	onSuccess,
}: Props) {
	const [interviewDate, setInterviewDate] = useState('');
	const [interviewTime, setInterviewTime] = useState('');
	const [interviewVenue, setInterviewVenue] = useState('');
	const [interviewNotes, setInterviewNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	if (!applicant) return null;

	const handleSchedule = async () => {
		if (!interviewDate) return;
		setSubmitting(true);
		try {
			await api.patch(`/applications/${applicant.id}/schedule-interview`, {
				interviewDate,
				interviewTime,
				interviewVenue,
				interviewNotes,
			});
			sileo.success({
				title: 'Scheduled',
				description: 'Interview scheduled successfully.',
			});
			onOpenChange(false);
			onSuccess();
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
			<DialogContent className='w-[95vw] max-w-md sm:w-full overflow-y-auto max-h-[90vh] scrollbar-thin'>
				<DialogHeader>
					<DialogTitle>Schedule Interview</DialogTitle>
					<DialogDescription>
						Candidate: {applicant.lastName}, {applicant.firstName} (
						{applicant.gradeLevel.name} - {applicant.applicantType})
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-2'>
					<div className='rounded-lg border p-3 bg-green-50 space-y-2'>
						<div className='flex items-center gap-2 text-emerald-700 font-bold text-sm'>
							<span>✓</span>
							<span>Written Exam Passed</span>
						</div>
						<p className='text-[0.625rem] text-muted-foreground leading-relaxed'>
							This applicant has passed the written entrance exam. An interview
							is required before section assignment.
						</p>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label>Interview Date</Label>
							<Input
								type='date'
								value={interviewDate}
								onChange={(e) => setInterviewDate(e.target.value)}
							/>
							{interviewDate && (
								<p className='text-[0.625rem] text-muted-foreground'>
									{format(new Date(interviewDate), 'MMMM dd, yyyy')}
								</p>
							)}
						</div>
						<div className='space-y-2'>
							<Label>Interview Time</Label>
							<Input
								type='time'
								value={interviewTime}
								onChange={(e) => setInterviewTime(e.target.value)}
							/>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label>Venue (Optional)</Label>
							<Input
								placeholder='e.g. Guidance Office'
								value={interviewVenue}
								onChange={(e) => setInterviewVenue(e.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label>Notes (Optional)</Label>
							<Input
								placeholder='e.g. Bring portfolio'
								value={interviewNotes}
								onChange={(e) => setInterviewNotes(e.target.value)}
							/>
						</div>
					</div>

					<div className='flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 text-xs'>
						<Info className='h-3.5 w-3.5 shrink-0 mt-0.5' />
						<p>
							A confirmation email will be sent to the parent/guardian at{' '}
							<span className='font-bold'>
								{applicant.emailAddress || 'N/A'}
							</span>{' '}
							with the interview schedule.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSchedule}
						disabled={!interviewDate || submitting}
					>
						Confirm Schedule
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
