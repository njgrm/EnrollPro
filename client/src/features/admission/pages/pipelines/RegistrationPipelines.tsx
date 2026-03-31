import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '@/shared/ui/skeleton';
import { useScpConfigs } from '@/features/admission/hooks/useScpConfigs';
import { SCP_ACRONYMS } from '@/shared/lib/utils';
import PipelineBatchView from '@/features/admission/components/PipelineBatchView';

export default function RegistrationPipelines() {
	const { configs, loading, error } = useScpConfigs();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get('tab') || 'REGULAR';

	const handleTabChange = (value: string) => {
		setSearchParams({ tab: value }, { replace: true });
	};

	// Build tab entries: Regular first, then each offered SCP
	const tabs = [
		{ key: 'REGULAR', label: 'Regular' },
		...configs.map((c) => ({
			key: c.scpType,
			label: SCP_ACRONYMS[c.scpType] || c.scpType,
		})),
	];

	if (loading) {
		return (
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold text-foreground tracking-tight'>
						Registration Pipelines
					</h1>
					<p className='text-sm font-bold text-muted-foreground'>
						Batch-process applicants by curriculum program
					</p>
				</div>
				<div className='flex gap-2'>
					{[1, 2, 3].map((i) => (
						<Skeleton
							key={i}
							className='h-9 w-32'
						/>
					))}
				</div>
				<Skeleton className='h-96 w-full' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold text-foreground tracking-tight'>
						Registration Pipelines
					</h1>
				</div>
				<div className='rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center'>
					<p className='text-sm text-destructive font-medium'>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold text-foreground tracking-tight'>
					Registration Pipelines
				</h1>
				<p className='text-sm font-bold text-muted-foreground'>
					Batch-process applicants by curriculum program
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className='w-full'
			>
				<TabsList className='w-full flex flex-wrap h-auto gap-1 mb-6 p-1 bg-white border-border relative'>
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab.key}
							value={tab.key}
							className='flex-1 min-w-25 font-bold transition-all relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none'
						>
							{activeTab === tab.key && (
								<motion.div
									layoutId='pipeline-active-pill'
									className='absolute inset-0 bg-primary rounded-md'
									transition={{
										type: 'spring',
										bounce: 0.15,
										duration: 0.5,
									}}
								/>
							)}
							<span className='relative z-20'>{tab.label}</span>
						</TabsTrigger>
					))}
				</TabsList>

				<AnimatePresence mode='wait'>
					{tabs.map(
						(tab) =>
							activeTab === tab.key && (
								<motion.div
									key={tab.key}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
									className='w-full'
								>
									<TabsContent
										value={tab.key}
										forceMount
										className='mt-0 focus-visible:outline-none ring-0'
									>
										<PipelineBatchView applicantType={tab.key} />
									</TabsContent>
								</motion.div>
							),
					)}
				</AnimatePresence>
			</Tabs>
		</div>
	);
}
