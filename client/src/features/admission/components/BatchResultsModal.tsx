import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface BatchResults {
	processed: number;
	succeeded: Array<{
		id: number;
		name: string;
		trackingNumber: string;
		previousStatus: string;
	}>;
	failed: Array<{
		id: number;
		name: string;
		trackingNumber: string;
		reason: string;
	}>;
}

interface Props {
	results: BatchResults | null;
	onReselectFailed?: (ids: number[]) => void;
	onClose: () => void;
}

export default function BatchResultsModal({
	results,
	onReselectFailed,
	onClose,
}: Props) {
	if (!results) return null;

	const { processed, succeeded, failed } = results;

	return (
		<Dialog
			open={!!results}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogContent className='max-w-lg max-h-[80vh] flex flex-col'>
				<DialogHeader>
					<DialogTitle className='text-lg font-bold'>
						Batch Processing Results
					</DialogTitle>
					<DialogDescription>
						{processed} applicant{processed !== 1 ? 's' : ''} processed
					</DialogDescription>
				</DialogHeader>

				<div className='flex-1 overflow-auto space-y-4 py-2'>
					{/* Summary */}
					<div className='flex gap-4'>
						<div className='flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2 flex-1'>
							<CheckCircle2 className='size-5 text-green-600' />
							<div>
								<p className='text-xl font-bold text-green-700'>
									{succeeded.length}
								</p>
								<p className='text-xs font-bold text-green-600'>Succeeded</p>
							</div>
						</div>
						{failed.length > 0 && (
							<div className='flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 flex-1'>
								<XCircle className='size-5 text-red-600' />
								<div>
									<p className='text-xl font-bold text-red-700'>
										{failed.length}
									</p>
									<p className='text-xs font-bold text-red-600'>Failed</p>
								</div>
							</div>
						)}
					</div>

					{/* Failed records */}
					{failed.length > 0 && (
						<div>
							<h4 className='text-sm font-bold text-red-700 mb-2'>
								Failed Records
							</h4>
							<div className='space-y-1.5 max-h-40 overflow-auto'>
								{failed.map((item) => (
									<div
										key={item.id}
										className='rounded border border-red-200 bg-red-50/50 px-3 py-2'
									>
										<p className='text-sm font-bold'>
											{item.name}
											{item.trackingNumber && (
												<span className='font-normal text-muted-foreground ml-1.5'>
													#{item.trackingNumber}
												</span>
											)}
										</p>
										<p className='text-xs text-red-600'>{item.reason}</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Succeeded records */}
					{succeeded.length > 0 && (
						<div>
							<h4 className='text-sm font-bold text-green-700 mb-2'>
								Succeeded
							</h4>
							<div className='space-y-1 max-h-40 overflow-auto'>
								{succeeded.map((item) => (
									<div
										key={item.id}
										className='flex items-center gap-2 rounded border border-green-200 bg-green-50/50 px-3 py-1.5'
									>
										<CheckCircle2 className='size-3.5 text-green-600 shrink-0' />
										<span className='text-sm font-bold'>{item.name}</span>
										<span className='text-xs text-muted-foreground'>
											{item.previousStatus} →{' '}
											<span className='font-bold text-green-700'>updated</span>
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					{failed.length > 0 && onReselectFailed && (
						<Button
							variant='outline'
							onClick={() => {
								onReselectFailed(failed.map((item) => item.id));
								onClose();
							}}
							className='font-bold'
						>
							Re-select Failed & Close
						</Button>
					)}
					<Button
						onClick={onClose}
						className='font-bold'
					>
						Close & Refresh
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
