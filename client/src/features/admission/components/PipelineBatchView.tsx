import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CheckSquare, Square } from 'lucide-react';
import api from '@/shared/api/axiosInstance';
import { useSettingsStore } from '@/store/settings.slice';
import { toastApiError } from '@/shared/hooks/useApiToast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { Checkbox } from '@/shared/ui/checkbox';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusBadge } from '@/features/enrollment/components/StatusBadge';
import { useDelayedLoading } from '@/shared/hooks/useDelayedLoading';
import { format } from 'date-fns';
import BatchResultsModal from './BatchResultsModal';
import type { BatchResults } from './BatchResultsModal';

interface Application {
	id: number;
	lrn: string;
	lastName: string;
	firstName: string;
	middleName: string | null;
	suffix: string | null;
	trackingNumber: string;
	status: string;
	applicantType: string;
	gradeLevelId: number;
	gradeLevel: { name: string };
	createdAt: string;
}

const STATUS_OPTIONS = [
	{ value: 'ALL', label: 'All Active Applications' },
	{ value: 'SUBMITTED', label: 'Submitted' },
	{ value: 'UNDER_REVIEW', label: 'Under Review' },
	{ value: 'FOR_REVISION', label: 'For Revision' },
	{ value: 'ELIGIBLE', label: 'Eligible' },
	{ value: 'ASSESSMENT_SCHEDULED', label: 'Exam Scheduled' },
	{ value: 'ASSESSMENT_TAKEN', label: 'Exam Taken' },
	{ value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
	{ value: 'PASSED', label: 'Passed' },
	{ value: 'NOT_QUALIFIED', label: 'Not Qualified' },
	{ value: 'REJECTED', label: 'Rejected' },
	{ value: 'WITHDRAWN', label: 'Withdrawn' },
];

const TARGET_STATUS_OPTIONS = [
	{ value: 'UNDER_REVIEW', label: 'Under Review' },
	{ value: 'ELIGIBLE', label: 'Eligible' },
	{ value: 'ASSESSMENT_SCHEDULED', label: 'Exam Scheduled' },
	{ value: 'PASSED', label: 'Passed' },
	{ value: 'PRE_REGISTERED', label: 'Pre-Registered' },
	{ value: 'NOT_QUALIFIED', label: 'Not Qualified' },
	{ value: 'REJECTED', label: 'Rejected' },
	{ value: 'WITHDRAWN', label: 'Withdrawn' },
];

interface Props {
	applicantType: string;
}

export default function PipelineBatchView({ applicantType }: Props) {
	const { activeSchoolYearId, viewingSchoolYearId } = useSettingsStore();
	const ayId = viewingSchoolYearId ?? activeSchoolYearId;

	const [applications, setApplications] = useState<Application[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const showSkeleton = useDelayedLoading(loading);

	// Filters
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('ALL');
	const [page, setPage] = useState(1);
	const limit = 50;

	// Selection
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	// Batch processing
	const [targetStatus, setTargetStatus] = useState('');
	const [isBatchProcessing, setIsBatchProcessing] = useState(false);
	const [batchResults, setBatchResults] = useState<BatchResults | null>(null);

	const fetchData = useCallback(async () => {
		if (!ayId) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.append('search', search);
			if (status !== 'ALL') params.append('status', status);
			if (applicantType !== 'ALL')
				params.append('applicantType', applicantType);
			params.append('page', String(page));
			params.append('limit', String(limit));

			const res = await api.get(`/applications?${params.toString()}`);

			let filteredApps = res.data.applications;
			if (status === 'ALL') {
				filteredApps = filteredApps.filter(
					(app: Application) =>
						!['ENROLLED', 'PRE_REGISTERED'].includes(app.status),
				);
			}

			setApplications(filteredApps);
			setTotal(
				status === 'ALL'
					? res.data.total -
							(res.data.applications.length - filteredApps.length)
					: res.data.total,
			);
		} catch (err) {
			toastApiError(err as never);
		} finally {
			setLoading(false);
		}
	}, [ayId, search, status, applicantType, page]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Reset selection when filters change
	useEffect(() => {
		setSelectedIds(new Set());
	}, [status, search, applicantType, page]);

	const toggleSelect = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (selectedIds.size === applications.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(applications.map((a) => a.id)));
		}
	};

	const handleBatchProcess = async () => {
		if (selectedIds.size === 0 || !targetStatus) return;

		setIsBatchProcessing(true);
		try {
			const res = await api.patch('/applications/batch-process', {
				ids: Array.from(selectedIds),
				targetStatus,
			});

			setBatchResults(res.data);
			setSelectedIds(new Set());
		} catch (err) {
			toastApiError(err as never);
		} finally {
			setIsBatchProcessing(false);
		}
	};

	const handleResultsClose = () => {
		setBatchResults(null);
		fetchData();
	};

	const allSelected =
		applications.length > 0 && selectedIds.size === applications.length;

	return (
		<>
			<Card className='border-none shadow-sm bg-[hsl(var(--card))]'>
				<CardHeader className='px-3 sm:px-6 pb-3'>
					<div className='flex flex-col md:flex-row gap-3 md:gap-4 items-end'>
						<div className='flex-1 space-y-2 w-full'>
							<Label className='text-sm uppercase tracking-wider font-bold'>
								Search Applicant
							</Label>
							<div className='relative'>
								<Search className='absolute left-2.5 top-2.5 h-4 w-4' />
								<Input
									placeholder='LRN, First Name, Last Name...'
									className='pl-9 h-10 text-sm font-bold'
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setPage(1);
									}}
								/>
							</div>
						</div>
						<div className='space-y-2'>
							<Label className='text-sm uppercase tracking-wider font-bold'>
								Application Status
							</Label>
							<Select
								value={status}
								onValueChange={(v) => {
									setStatus(v);
									setPage(1);
								}}
							>
								<SelectTrigger className='h-10 md:w-56 text-sm font-bold'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{STATUS_OPTIONS.map((opt) => (
										<SelectItem
											key={opt.value}
											value={opt.value}
											className='text-sm font-bold'
										>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							variant='outline'
							className='h-10 px-3 w-full md:w-auto text-sm font-bold'
							onClick={() => {
								setSearch('');
								setStatus('ALL');
								setPage(1);
							}}
						>
							Reset
						</Button>
					</div>
				</CardHeader>
				<CardContent className='px-3 sm:px-6'>
					{/* Batch Action Toolbar */}
					{selectedIds.size > 0 && (
						<div className='flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3'>
							<span className='text-sm font-bold'>
								{selectedIds.size} selected
							</span>

							<Select
								value={targetStatus}
								onValueChange={setTargetStatus}
							>
								<SelectTrigger className='h-9 w-56 text-sm font-bold'>
									<SelectValue placeholder='Target status...' />
								</SelectTrigger>
								<SelectContent>
									{TARGET_STATUS_OPTIONS.map((opt) => (
										<SelectItem
											key={opt.value}
											value={opt.value}
											className='text-sm font-bold'
										>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								size='sm'
								disabled={!targetStatus || isBatchProcessing}
								onClick={handleBatchProcess}
								className='font-bold'
							>
								{isBatchProcessing ? (
									<>
										<Loader2 className='size-4 animate-spin mr-1.5' />
										Processing...
									</>
								) : (
									`Process ${selectedIds.size} Applicant${selectedIds.size > 1 ? 's' : ''}`
								)}
							</Button>

							<Button
								variant='ghost'
								size='sm'
								onClick={() => setSelectedIds(new Set())}
								className='font-bold text-muted-foreground'
							>
								Deselect All
							</Button>
						</div>
					)}

					{/* Table */}
					<div className='rounded-xl border overflow-hidden'>
						<Table className='border-collapse'>
							<TableHeader className='bg-[hsl(var(--primary))]'>
								<TableRow>
									<TableHead className='w-12 text-center text-primary-foreground'>
										<button
											type='button'
											onClick={toggleSelectAll}
											className='flex items-center justify-center'
											disabled={isBatchProcessing}
										>
											{allSelected ? (
												<CheckSquare className='size-4 text-primary-foreground' />
											) : (
												<Square className='size-4 text-primary-foreground/60' />
											)}
										</button>
									</TableHead>
									<TableHead className='text-center font-bold text-primary-foreground text-sm'>
										APPLICANT
									</TableHead>
									<TableHead className='text-center font-bold text-primary-foreground hidden md:table-cell text-sm'>
										LRN
									</TableHead>
									<TableHead className='text-center font-bold text-primary-foreground text-sm'>
										GRADE LEVEL
									</TableHead>
									<TableHead className='text-center font-bold text-primary-foreground text-sm'>
										STATUS
									</TableHead>
									<TableHead className='text-center font-bold text-primary-foreground hidden xl:table-cell text-sm'>
										DATE
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{showSkeleton ? (
									Array.from({ length: 5 }).map((_, i) => (
										<TableRow key={i}>
											<TableCell className='text-sm'>
												<Skeleton className='h-4 w-4' />
											</TableCell>
											<TableCell className='text-sm'>
												<div className='space-y-2'>
													<Skeleton className='h-4 w-32' />
													<Skeleton className='h-3 w-24' />
												</div>
											</TableCell>
											<TableCell className='hidden md:table-cell text-sm'>
												<Skeleton className='h-4 w-24' />
											</TableCell>
											<TableCell className='text-sm'>
												<div className='flex justify-center'>
													<Skeleton className='h-4 w-16' />
												</div>
											</TableCell>
											<TableCell className='text-sm'>
												<div className='flex justify-center'>
													<Skeleton className='h-6 w-20 rounded-full' />
												</div>
											</TableCell>
											<TableCell className='hidden xl:table-cell text-sm'>
												<div className='flex justify-center'>
													<Skeleton className='h-4 w-24' />
												</div>
											</TableCell>
										</TableRow>
									))
								) : applications.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className='h-24 text-center text-sm font-bold'
										>
											No applicants found.
										</TableCell>
									</TableRow>
								) : (
									applications.map((app) => (
										<TableRow
											key={app.id}
											className={`hover:bg-[hsl(var(--muted))] transition-colors text-center text-sm ${
												selectedIds.has(app.id)
													? 'bg-[hsl(var(--muted))] shadow-inner'
													: ''
											}`}
										>
											<TableCell>
												<Checkbox
													checked={selectedIds.has(app.id)}
													onCheckedChange={() => toggleSelect(app.id)}
													disabled={isBatchProcessing}
												/>
											</TableCell>
											<TableCell>
												<div className='flex flex-col text-left'>
													<span className='font-bold text-sm uppercase'>
														{app.lastName}, {app.firstName}{' '}
														{app.middleName
															? `${app.middleName.charAt(0)}.`
															: ''}
														{app.suffix ? ` ${app.suffix}` : ''}
													</span>
													<span className='text-sm font-bold'>
														{app.trackingNumber}
													</span>
												</div>
											</TableCell>
											<TableCell className='hidden md:table-cell text-sm font-bold'>
												{app.lrn || '—'}
											</TableCell>
											<TableCell>
												<span className='font-bold text-sm'>
													{app.gradeLevel?.name ?? '—'}
												</span>
											</TableCell>
											<TableCell>
												<StatusBadge
													status={app.status}
													className='text-sm font-bold'
												/>
											</TableCell>
											<TableCell className='text-sm hidden xl:table-cell font-bold'>
												{format(new Date(app.createdAt), 'MMMM dd, yyyy')}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div className='flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 font-bold'>
						<span className='text-xs'>
							Showing {applications.length} applicants
						</span>
						<div className='flex items-center gap-2'>
							<Button
								variant='outline'
								size='sm'
								className='h-9 sm:h-8 text-xs'
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<Badge
								variant='secondary'
								className='px-3 h-8 text-xs'
							>
								Page {page}
							</Badge>
							<Button
								variant='outline'
								size='sm'
								className='h-9 sm:h-8 text-xs'
								onClick={() => setPage((p) => p + 1)}
								disabled={page * limit >= total}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Batch Results Modal */}
			<BatchResultsModal
				results={batchResults}
				onClose={handleResultsClose}
			/>
		</>
	);
}
