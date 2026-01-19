import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PageDetailMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * PageDetailMain - Main content area for detail views
 *
 * Flexible main content with card styling and ScrollArea.
 * Fills remaining space with min-w-0 to prevent flex overflow.
 *
 * @example
 * ```tsx
 * <PageDetailMain>
 *   <Tabs defaultValue="overview">
 *     <TabsList>...</TabsList>
 *     <TabsContent value="overview">
 *       <DashboardGrid />
 *     </TabsContent>
 *   </Tabs>
 * </PageDetailMain>
 * ```
 */
export function PageDetailMain({ children, className, ...props }: PageDetailMainProps) {
  return (
    <main
      className={cn(
        "flex-1 min-w-0 h-full overflow-hidden",
        className
      )}
      {...props}
    >
      <ScrollArea className="h-full">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </ScrollArea>
    </main>
  )
}
