"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0f172a]">
      {/* Navigation */}
      <nav className="w-full border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-[#1a1d29] dark:text-white">
            CollabVerse
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-[#64748b] dark:text-[#94a3b8] hover:text-[#1a1d29] dark:hover:text-white transition-colors font-medium"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1a1d29] dark:text-white mb-4 leading-tight">
            Study Together,
            <br />
            <span className="bg-gradient-to-r from-[#4f46e5] to-[#6366f1] bg-clip-text text-transparent">
              Succeed Together
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[#64748b] dark:text-[#94a3b8] mb-8 max-w-2xl mx-auto">
            The collaborative platform designed for students. Organize projects, share notes, and work together seamlessly.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-20">
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium text-sm shadow-sm"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-white dark:bg-[#1e293b] text-[#1a1d29] dark:text-white border border-[#e2e8f0] dark:border-[#334155] rounded-lg hover:border-[#4f46e5] dark:hover:border-[#6366f1] transition-colors font-medium text-sm"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] hover:border-[#4f46e5] dark:hover:border-[#6366f1] transition-colors">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-[#1a1d29] dark:text-white mb-2">
                Study Groups
              </h3>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                Create and join study groups. Share notes and collaborate on assignments.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] hover:border-[#4f46e5] dark:hover:border-[#6366f1] transition-colors">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-lg font-semibold text-[#1a1d29] dark:text-white mb-2">
                Project Management
              </h3>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                Organize your projects and track progress with your team members.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-[#1e293b] rounded-lg border border-[#e2e8f0] dark:border-[#334155] hover:border-[#4f46e5] dark:hover:border-[#6366f1] transition-colors">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-[#1a1d29] dark:text-white mb-2">
                Real-time Chat
              </h3>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                Communicate instantly with your team. Stay connected and productive.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#e2e8f0] dark:border-[#1e293b] mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
          <p>&copy; 2024 CollabVerse. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
