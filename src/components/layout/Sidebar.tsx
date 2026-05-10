'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  FileText,
  AlertTriangle,
  BarChart3,
  Copy,
  Settings,
  Globe,
} from 'lucide-react';

const mainNav = [
  { href: '/dashboard', label: 'Portfolio', icon: LayoutDashboard },
];

const siteNav = [
  { href: '', label: 'Visao Geral', icon: Globe },
  { href: '/performance', label: 'Performance', icon: BarChart3 },
  { href: '/keywords', label: 'Keywords', icon: Search },
  { href: '/pages', label: 'Paginas', icon: FileText },
  { href: '/issues', label: 'Issues', icon: AlertTriangle },
  { href: '/cannibalization', label: 'Canibalizacao', icon: Copy },
  { href: '/settings', label: 'Configuracoes', icon: Settings },
];

export function Sidebar({ siteId }: { siteId?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-[#1a1a2e]">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <Search className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">SEO Center</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {siteId && (
          <>
            <div className="my-4 border-t border-white/10" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500">
              Site
            </p>
            {siteNav.map((item) => {
              const href = `/sites/${siteId}${item.href}`;
              const isActive =
                item.href === ''
                  ? pathname === `/sites/${siteId}`
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
