'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { userAuthSchema, type UserAuthFormValues } from '../types/auth-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { createClient } from '@/lib/supabase/client'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    type: 'login' | 'register'
}

export function UserAuthForm({ className, type, ...props }: UserAuthFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

    const form = useForm<UserAuthFormValues>({
        resolver: zodResolver(userAuthSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: UserAuthFormValues) {
        setIsLoading(true)

        try {
            if (type === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                })
                if (error) throw error
                toast.success('Signed in successfully')
                router.push('/dashboard')
            } else {
                const { error } = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                toast.success('Account created. Please check your email.')
            }
        } catch (error) {
            toast.error('Authentication failed', {
                description: (error as Error).message
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn('grid gap-6', className)} {...props}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="name@example.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        disabled={isLoading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Password"
                                        type="password"
                                        autoCapitalize="none"
                                        autoComplete={type === 'register' ? 'new-password' : 'current-password'}
                                        disabled={isLoading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        )}
                        {type === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
