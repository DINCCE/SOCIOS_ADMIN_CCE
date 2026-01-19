import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PageDetailSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * PageDetailSidebar - Left sidebar for detail views
 *
 * Percentage-based sidebar that maintains ~20% width with constraints:
 * - lg: min 280px, max 400px (flex-basis with clamping)
 * - xl: min 300px, max 440px (slightly wider on large screens)
 * - Mobile: Full width (stacks above content)
 *
 * This creates a consistent 80/20 split across screen sizes while
 * preventing the sidebar from becoming too narrow or too wide.
 *
 * @example
 * ```tsx
 * <PageDetailSidebar>
 *   <PersonIdentityPanel persona={persona} />
 *   <RelatedEntitiesList />
 * </PageDetailSidebar>
 * ```
 */
export function PageDetailSidebar({ children, className, ...props }: PageDetailSidebarProps) {
  return (
    <aside
      className={cn(
        "w-full lg:flex-[0_0_20%] lg:min-w-[280px] lg:max-w-[400px] xl:min-w-[300px] xl:max-w-[440px] flex-shrink-0 flex flex-col gap-4",
        className
      )}
      {...props}
    >
      <ScrollArea className="h-full pr-4 -mr-4">
        <div className="flex flex-col gap-4 pb-4">
          {children}
        </div>
      </ScrollArea>
    </aside>
  )
}
