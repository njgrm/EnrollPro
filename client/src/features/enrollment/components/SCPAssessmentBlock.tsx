import { format } from 'date-fns';
import type { ApplicantDetail } from '@/features/enrollment/hooks/useApplicationDetail';
import { formatScpType } from '@/shared/lib/utils';

interface Props {
	applicant: ApplicantDetail;
}

export function SCPAssessmentBlock({ applicant }: Props) {
	if (applicant.applicantType === 'REGULAR') return null;

	return (
		<div className='border border-primary/50 bg-primary/8 rounded-md p-3 mb-4 space-y-2'>
			<div className='flex items-center gap-2 font-bold border-b border-primary/50 pb-2 mb-2'>
				<span>⚡</span>
				<span>{formatScpType(applicant.applicantType)} ASSESSMENT</span>
			</div>

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
						: applicant.examResult || '—'}
				</span>

				{applicant.auditionResult && (
					<>
						<span>Audition:</span>
						<span className='uppercase'>{applicant.auditionResult}</span>
					</>
				)}

				{applicant.tryoutResult && (
					<>
						<span>Tryout:</span>
						<span className='uppercase'>{applicant.tryoutResult}</span>
					</>
				)}

				{applicant.examNotes && (
					<>
						<span>Notes:</span>
						<span className='uppercase italic'>{applicant.examNotes}</span>
					</>
				)}
			</div>

			{/* Interview Section */}
			{applicant.interviewDate && (
				<>
					<div className='flex items-center gap-2 font-bold border-t border-primary/50 pt-2 mt-2'>
						<span>🎤</span>
						<span>INTERVIEW</span>
					</div>
					<div className='text-sm grid grid-cols-[110px_1fr] gap-1 font-bold'>
						<span>Date:</span>
						<span className='uppercase'>
							{format(new Date(applicant.interviewDate), 'MMM dd, yyyy')}
						</span>

						{applicant.interviewResult && (
							<>
								<span>Result:</span>
								<span className='uppercase'>{applicant.interviewResult}</span>
							</>
						)}

						{applicant.interviewNotes && (
							<>
								<span>Notes:</span>
								<span className='uppercase italic'>
									{applicant.interviewNotes}
								</span>
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}
