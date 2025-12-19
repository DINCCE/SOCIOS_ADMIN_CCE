import Link from "next/link"

import { UserAuthForm } from "@/features/auth/components/user-auth-form"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default function LoginPage() {
    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to sign in to your account
                </p>
            </div>
            <UserAuthForm type="login" />
            <p className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/register"
                    className="hover:text-brand underline underline-offset-4"
                >
                    Don&apos;t have an account? Sign Up
                </Link>
            </p>
        </>
    )
}
