import { cn } from "@/lib/utils"

interface PageDetailLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * PageDetailLayout - Flex container for detail view layout
 *
 * Provides responsive two-column layout for detail pages.
 * Integrates with PageShell as content area.
 *
 * @example
 * ```tsx
 * <PageShell>
 *   <PageHeader title="Person Detail" />
 *   <PageDetailLayout>
 *     <PageDetailSidebar><IdentityPanel /></PageDetailSidebar>
 *     <PageDetailMain><TabsContent /></PageDetailMain>
 *   </PageDetailLayout>
 * </PageShell>
 * ```
 */
export function PageDetailLayout({ children, className, ...props }: PageDetailLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-6 p-4 md:p-6 flex-1 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
