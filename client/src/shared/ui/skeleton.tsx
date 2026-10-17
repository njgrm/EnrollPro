import { cn } from '@/shared/lib/utils';
import type React from 'react';
import { isLoggingOut } from '@/shared/lib/logoutState';

function Skeleton({
	className,
	'aria-hidden': ariaHidden = true,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	if (isLoggingOut()) {
		return null;
	}
	return (
		<div
			aria-hidden={ariaHidden}
			className={cn(
				'relative overflow-hidden rounded-md bg-muted',
				'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent motion-reduce:before:animate-none',
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
