import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { LogIn, Mail, Lock } from "lucide-react"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent } from "@/components/ui/card"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z.object({
  username: z.email({ message: "Введите корректный email" }),
  password: z
    .string()
    .min(1, { message: "Введите пароль" })
    .min(8, { message: "Пароль должен содержать не менее 8 символов" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Вход — Образовательная платформа",
      },
    ],
  }),
})

function Login() {
  const { loginMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                {/* Header */}
                <div className="flex flex-col items-center gap-3 text-center mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <LogIn className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Вход</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      Войдите в свой аккаунт для продолжения
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              data-testid="email-input"
                              placeholder="user@example.com"
                              type="email"
                              className="pl-10 bg-secondary/50"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-semibold">Пароль</FormLabel>
                          <RouterLink
                            to="/recover-password"
                            className="text-xs text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
                          >
                            Забыли пароль?
                          </RouterLink>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <PasswordInput
                              data-testid="password-input"
                              placeholder="Введите пароль"
                              className="pl-10 bg-secondary/50"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <LoadingButton
                    type="submit"
                    loading={loginMutation.isPending}
                    className="h-11 text-base font-semibold"
                  >
                    {loginMutation.isPending ? "Вход..." : "Войти"}
                  </LoadingButton>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">или</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Нет аккаунта? </span>
                  <RouterLink
                    to="/signup"
                    className="font-semibold text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
                  >
                    Зарегистрироваться
                  </RouterLink>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Для тестирования используйте:
          </p>
          <p className="text-xs font-mono bg-background/50 rounded px-2 py-1 inline-block">
            admin@example.com
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
