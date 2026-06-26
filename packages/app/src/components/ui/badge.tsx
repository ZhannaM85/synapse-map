import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-foreground/10 text-foreground',
                secondary: 'border-transparent bg-muted text-muted-foreground',
                outline: 'text-foreground',
            },
            size: {
                sm: 'px-1 py-px text-[9px]',
                default: 'px-1.5 py-px text-[10px]',
                lg: 'px-2 py-0.5 text-xs font-bold',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
