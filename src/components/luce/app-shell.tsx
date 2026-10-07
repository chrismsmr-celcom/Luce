import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutGrid,
  LogOut,
  Inbox,
  FolderOpen,
  Layers,
  NotebookPen,
  Plug,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AgentDock } from "./agent-dock";
import { signOut } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/supabase";

const WORK = [
  { title: "Aujourd'hui", url: "/", icon: LayoutGrid },
  { title: "Inbox", url: "/inbox", icon: Inbox },
  { title: "Dossiers", url: "/dossiers", icon: FolderOpen },
  { title: "Artefacts", url: "/artefacts", icon: Layers },
  { title: "Notebook", url: "/notebook", icon: NotebookPen },
] as const;
const SYSTEM = [
  { title: "Connexions", url: "/connexions", icon: Plug },
  { title: "Paramètres", url: "/parametres", icon: Settings },
] as const;

function NavGroup({ label, items }: { label: string; items: readonly { title: string; url: string; icon: typeof Inbox }[] }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((i) => {
            const active = i.url === "/" ? path === "/" : path.startsWith(i.url);
            return (
              <SidebarMenuButton
                key={i.url}
                asChild
                isActive={active}
                tooltip={i.title}
                className="h-10 data-[active=true]:bg-secondary data-[active=true]:text-secondary-foreground"
              >
                <Link to={i.url} onClick={() => setOpenMobile(false)}>
                  <i.icon className="size-4" />
                  <span>{i.title}</span>
                </Link>
              </SidebarMenuButton>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function LuceSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link to="/">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground">
                  L
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="font-display text-base font-bold tracking-wide">LUCE</div>
                  <div className="truncate text-xs text-muted-foreground">Chef de cabinet IA</div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Espace de travail" items={WORK} />
        <NavGroup label="Système" items={SYSTEM} />
      </SidebarContent>
      <SidebarFooter>
        {AUTH_ENABLED && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Se déconnecter" className="h-10" onClick={() => void signOut()}>
                <LogOut className="size-4" />
                <span>Se déconnecter</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
          <ShieldCheck className="size-4 shrink-0 text-success" />
          <span className="truncate group-data-[collapsible=icon]:hidden">Protégé par Cerbère</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <LuceSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger />
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="truncate">Luce est en ligne</span>
            </div>
          </header>
          <main className="flex-1 px-3 pb-28 pt-5 sm:px-6 lg:px-10">{children}</main>
          <AgentDock />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
