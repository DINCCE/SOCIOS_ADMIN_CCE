
export default function BillingPage() {
    return (
        <div className="flex flex-col gap-4 p-8">
            <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">
                Manage your subscription and billing details.
            </p>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm max-w-2xl">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Subscription Plan</h3>
                    <p className="text-sm text-muted-foreground">You are currently on the Free plan.</p>
                </div>
                <div className="p-6 pt-0">
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        Upgrade to Pro
                    </button>
                </div>
            </div>
        </div>
    );
}
