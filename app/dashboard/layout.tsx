import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, User, Briefcase, FileText, MessageSquare, Settings, Users, ClipboardList } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const role = profile?.role || 'contractor'

  const navItems = {
    contractor: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/contractor/profile', label: 'My Profile', icon: User },
      { href: '/contractor/apply', label: 'Browse Jobs', icon: Briefcase },
      { href: '/contractor/documents', label: 'My Documents', icon: FileText },
      { href: '/contractor/checklist', label: 'Onboarding', icon: ClipboardList },
      { href: '/contractor/messages', label: 'Messages', icon: MessageSquare },
    ],
    client: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/client/post-job', label: 'Post a Role', icon: Briefcase },
      { href: '/client/dashboard', label: 'My Roles', icon: ClipboardList },
      { href: '/client/documents', label: 'Documents', icon: FileText },
      { href: '/client/messages', label: 'Messages', icon: MessageSquare },
    ],
    admin: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/contractors', label: 'Contractors', icon: Users },
      { href: '/admin/clients', label: 'Clients', icon: Briefcase },
      { href: '/admin/jobs', label: 'Jobs', icon: ClipboardList },
      { href: '/admin/documents', label: 'Documents', icon: FileText },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { href: '/admin/contacts', label: 'Contact Forms', icon: MessageSquare },
    ],
  }

  const links = navItems[role as keyof typeof navItems] || navItems.contractor

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0B1F3A] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">IQ</div>
            <div>
              <div className="text-white text-sm font-semibold leading-none">Innovate IQ</div>
              <div className="text-white/40 text-xs mt-0.5 capitalize">{role} Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(item => (
            <Link
              key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium group"
            >
              <item.icon size={16} className="flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 bg-blue-600/30 rounded-full flex items-center justify-center text-blue-300 text-xs font-semibold">
              {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{profile?.full_name || 'User'}</div>
              <div className="text-white/40 text-xs truncate">{user.email}</div>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm">
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
