import Link from "next/link";
import Logo from "./Logo";

// Split layout for login/signup: form on the left, editorial statement on the right.
export default function AuthShell({ title, subtitle, children, footer, aside }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm animate-rise">
            <h1 className="display text-5xl sm:text-6xl mb-3">{title}</h1>
            <p className="text-muted mb-10">{subtitle}</p>
            {children}
            <p className="mt-8 text-sm text-muted">{footer}</p>
          </div>
        </main>
      </div>

      <aside className="relative hidden lg:flex flex-col justify-end overflow-hidden bg-sage-soft p-14">
        <div aria-hidden="true" className="absolute -top-32 -right-32 h-[34rem] w-[34rem] rounded-full bg-sage" />
        <div aria-hidden="true" className="absolute top-24 right-[26rem] h-16 w-16 rounded-full bg-tomato" />
        <div aria-hidden="true" className="absolute top-40 right-56 h-56 w-56 rounded-full border-[3px] border-ink/80" />
        <div className="relative">{aside}</div>
      </aside>
    </div>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger whitespace-pre-line">
      {children}
    </p>
  );
}

export function AuthLink({ href, children }) {
  return (
    <Link href={href} className="font-semibold text-ink underline decoration-tomato decoration-2 underline-offset-4 hover:text-tomato-deep">
      {children}
    </Link>
  );
}
