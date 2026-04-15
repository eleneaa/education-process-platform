import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left: form area */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <Logo variant="full" className="h-8" asLink={false} />
          <Appearance />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <Footer />
      </div>

      {/* Right: decorative panel */}
      <div className="relative hidden lg:flex bg-[#1e3a5f] text-white flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] right-[-10%] h-80 w-80 rounded-full bg-white/20" />
          <div className="absolute bottom-[-5%] left-[-5%] h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute top-[40%] left-[10%] h-32 w-32 rounded-full bg-orange-500/30" />
        </div>

        <div className="relative z-10 max-w-sm text-center space-y-6">
          <div className="inline-flex items-center justify-center rounded-full bg-white/10 p-4 mb-4">
            <svg
              className="h-10 w-10 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-wide leading-tight">
            УПРАВЛЯЙТЕ ОБРАЗОВАТЕЛЬНЫМ ПРОЦЕССОМ В ОДНОМ МЕСТЕ
          </h2>

          <p className="text-white/70 text-sm leading-relaxed">
            Платформа для управления учебными программами, группами, прогрессом студентов и геймификацией обучения.
          </p>

          <div className="flex flex-col gap-3 pt-4 text-left">
            {[
              "Программы и модули",
              "Группы и преподаватели",
              "Трекинг прогресса",
              "Геймификация и достижения",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
