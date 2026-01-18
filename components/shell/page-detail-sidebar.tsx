import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PageDetailSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * PageDetailSidebar - Left sidebar for detail views
 *
 * Fixed-width sidebar (320px on lg+, 360px on xl+) with ScrollArea.
 * Stack above main content on mobile.
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
        "w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col gap-4",
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
