import { useState } from 'react'
import { z } from 'zod'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { hashPassword, normalizeEmail } from '@/server/auth/password'
import { createSession } from '@/server/auth/session'
import { requireContext } from '@/server/context'

const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must contain at least 2 characters.')
    .max(80, 'Display name is too long.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(190, 'Email is too long.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password is too long.'),
})

type RegisterInput = z.infer<typeof registerSchema>

type RegisterResult =
  | {
      success: false
      formError?: string
      fieldErrors?: Partial<Record<keyof RegisterInput, string>>
    }
  | { success: true }

const registerUser = createServerFn({ method: 'POST' })
  .inputValidator((input: RegisterInput) => registerSchema.parse(input))
  .handler(async ({ data, context }): Promise<Response | RegisterResult> => {
    const ctx = requireContext(context)
    const email = normalizeEmail(data.email)
    const existing = await ctx.prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return {
        success: false,
        fieldErrors: {
          email: 'An account already exists for this email.',
        },
      }
    }

    const passwordHash = await hashPassword(data.password)
    const user = await ctx.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: data.displayName,
      },
    })

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

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const action = useServerFn(registerUser)
  const router = useRouter()
  const [formValues, setFormValues] = useState<RegisterInput>({
    displayName: '',
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterInput, string>>
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 space-y-6 text-white shadow-2xl">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Create account
          </p>
          <h1 className="text-3xl font-bold">Join Codezoo</h1>
          <p className="text-gray-400">
            Save pens, sync revisions, and get secure session cookies for every
            device.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            label="Display name"
            name="displayName"
            value={formValues.displayName}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, displayName: value }))
            }
            error={fieldErrors.displayName}
            autoComplete="nickname"
            placeholder="Ada Lovelace"
          />

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
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
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
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="text-cyan-400 hover:text-cyan-300 underline-offset-4 underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
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
