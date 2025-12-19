import Link from "next/link"

import { UserAuthForm } from "@/features/auth/components/user-auth-form"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default function RegisterPage() {
    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Create an account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email below to create your account
                </p>
            </div>
            <UserAuthForm type="register" />
            <p className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/login"
                    className="hover:text-brand underline underline-offset-4"
                >
                    Already have an account? Sign In
                </Link>
            </p>
        </>
    )
}
