'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Count shown next to the item, e.g. unread inquiries. Hidden when 0. */
  badge?: number;
}

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

interface AppSidebarProps {
  sections: SidebarSection[];
  activeId: string;
  onSelect: (id: string) => void;
  user?: { firstName?: string; lastName?: string } | null;
  roleLabel: string;
  onLogout: () => void;
}

const COLLAPSED_KEY = "miniuni.sidebar.collapsed";

/**
 * Desktop navigation shared by the teacher and student dashboards: grouped
 * links, attention badges, and an icon-only mode that each person's browser
 * remembers. Phones use the bottom dock instead.
 */
const AppSidebar = ({ sections, activeId, onSelect, user, roleLabel, onLogout }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      /* storage unavailable: start expanded */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      } catch {
        /* not remembered, still toggles */
      }
      return !c;
    });
  };

  const initials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}` || roleLabel.charAt(0);
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || roleLabel;

  return (
    <aside
      className={`hidden lg:flex sticky top-0 h-screen shrink-0 flex-col p-4 transition-[width] duration-300 ${collapsed ? "w-[96px]" : "w-[252px]"}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-card backdrop-blur-xl grain">
        <div className={`flex items-center pb-4 pt-6 ${collapsed ? "flex-col gap-3 px-3" : "justify-between px-6"}`}>
          <Link href="/" className="flex items-center gap-2.5" title="MiniUni home">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-hero">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold tracking-tight">
                Mini<span className="font-serif italic font-normal">Uni</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-2">
          {sections.map((section, i) => (
            <div key={section.label ?? i} className="space-y-1">
              {section.label &&
                (collapsed ? (
                  i > 0 && <div className="mx-3 mb-2 border-t border-border/60" />
                ) : (
                  <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {section.label}
                  </p>
                ))}
              {section.items.map((item) => {
                const active = activeId === item.id;
                const badge = item.badge ?? 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex w-full items-center rounded-2xl py-2.5 text-sm transition-all duration-300 ${
                      collapsed ? "justify-center px-0" : "gap-3 px-4"
                    } ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <span className="relative">
                      <item.icon
                        className={`h-[18px] w-[18px] transition-transform duration-300 ${active ? "" : "group-hover:-translate-y-0.5"}`}
                        strokeWidth={1.75}
                      />
                      {collapsed && badge > 0 && (
                        <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
                      )}
                    </span>
                    {!collapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
                    {!collapsed && badge > 0 && (
                      <span
                        className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${
                          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div
            className={`flex items-center rounded-2xl border border-border/60 bg-background/60 ${
              collapsed ? "flex-col gap-2 p-2" : "gap-3 p-3"
            }`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-semibold text-primary-foreground"
              title={collapsed ? name : undefined}
            >
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
