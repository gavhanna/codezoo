import { useState } from 'react'
import { z } from 'zod'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { normalizeEmail, verifyPassword } from '@/server/auth/password'
import { createSession } from '@/server/auth/session'
import { requireContext } from '@/server/context'
import type { AppServerContext } from '@/server/context'
import { getCurrentUser } from '@/server/auth/current-user'
import { MarketingShell } from '@/components/MarketingShell'

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(190, 'Email is too long.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginInput = z.infer<typeof loginSchema>

type LoginResult =
  | {
      success: false
      formError?: string
      fieldErrors?: Partial<Record<keyof LoginInput, string>>
    }
  | { success: true }

const loginUser = createServerFn({ method: 'POST' })
  .inputValidator((input: LoginInput) => loginSchema.parse(input))
  .handler(async ({ data, context }): Promise<Response | LoginResult> => {
    const ctx = requireContext(context)
    const email = normalizeEmail(data.email)
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return {
        success: false,
        fieldErrors: { email: 'We could not find an account with that email.' },
      }
    }

    const passwordIsValid = await verifyPassword(
      data.password,
      user.passwordHash,
    )

    if (!passwordIsValid) {
      return {
        success: false,
        fieldErrors: {
          password: 'Incorrect password. Please try again.',
        },
      }
    }

    const { cookie } = await createSession({
      prisma: ctx.prisma,
      userId: user.id,
      ip: ctx.requestMetadata.ip,
      userAgent: ctx.requestMetadata.userAgent,
    })

    ctx.pendingCookies.push(cookie)

    return redirect({
      to: '/',
    })
  })

async function ensureLoggedOut(context?: AppServerContext | null) {
  if (context?.currentUser) {
    throw redirect({ to: '/app' })
  }

  if (!context) {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      throw redirect({ to: '/app' })
    }
  }
}

export const Route = createFileRoute('/_marketing/auth/login')({
  loader: async ({ context }) => {
    await ensureLoggedOut(context as AppServerContext | undefined)
    return null
  },
  component: LoginPage,
})

function LoginPage() {
  const action = useServerFn(loginUser)
  const router = useRouter()
  const [formValues, setFormValues] = useState<LoginInput>({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)
    setSubmitting(true)

    try {
      const result = await action({ data: formValues })
      if (result && 'success' in result && result.success === false) {
        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError ?? null)
        return
      }

      await router.navigate({ to: '/' })
    } catch (err) {
      setFormError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MarketingShell>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 space-y-6 text-white shadow-2xl">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold">Sign in to Codezoo</h1>
          <p className="text-gray-400">
            Access your pens, manage revisions, and continue where you left off.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, email: value }))
            }
            error={fieldErrors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={formValues.password}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, password: value }))
            }
            error={fieldErrors.password}
            autoComplete="current-password"
            placeholder="●●●●●●●●"
          />

          {formError && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Need an account?{' '}
          <Link
            to="/auth/register"
            className="text-cyan-400 hover:text-cyan-300 underline-offset-4 underline"
          >
            Create one
          </Link>
        </p>
        </div>
      </div>
    </MarketingShell>
  )
}

type FormFieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: React.HTMLInputTypeAttribute
  autoComplete?: string
  placeholder?: string
}

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  placeholder,
}: FormFieldProps) {
  return (
    <label className="block text-sm font-medium space-y-2">
      <span>{label}</span>
      <input
        required
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full px-4 py-3 rounded-2xl bg-slate-950/70 border ${
          error ? 'border-red-500' : 'border-white/10'
        } focus:outline-none focus:ring-2 focus:ring-cyan-400`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  )
}
