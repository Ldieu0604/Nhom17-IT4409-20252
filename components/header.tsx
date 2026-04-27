"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Bell, Calendar, FileText, LayoutGrid, Menu, Search, Settings, Sparkles, Users, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type HeaderProps = {
  user?: {
    name: string
    email: string
    imageUrl?: string | null
    initials: string
  } | null
  searchPlaceholder?: string
  notificationCount?: number
}

const navigation = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/dashboard#documents", label: "Tài liệu", icon: FileText },
  { href: "/dashboard#calendar", label: "Lịch", icon: Calendar },
  { href: "/dashboard#workspaces", label: "Nhóm", icon: Users },
]

export function Header({
  user,
  searchPlaceholder = "Tìm kiếm tài liệu, workspace...",
  notificationCount = 0,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userDisplay = useMemo(
    () =>
      user ?? {
        name: "Khách",
        email: "Bạn chưa đăng nhập",
        imageUrl: null,
        initials: "KH",
      },
    [user]
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/60 bg-white/68 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/62">
      <div className="container mx-auto flex h-[4.5rem] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-3">
            <div className="animated-sheen flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-chart-2 shadow-[0_14px_30px_-16px_rgba(79,70,229,0.62)]">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="block text-lg font-extrabold tracking-tight text-foreground">
                CoWorkHub
              </span>
              <span className="block text-xs text-muted-foreground">
                Không gian cộng tác tươi sáng, mạch lạc
              </span>
            </div>
            <span className="text-xl font-extrabold text-foreground sm:hidden">CWH</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white hover:text-foreground hover:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden flex-1 items-center justify-center px-6 lg:flex">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="h-11 rounded-full border-indigo-100 bg-white/88 pl-11 pr-4 shadow-[0_14px_28px_-22px_rgba(79,70,229,0.28)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative hidden rounded-full bg-white/70 shadow-sm sm:flex"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-chart-4 px-1 text-[10px] font-semibold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            ) : (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-chart-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="hidden rounded-full bg-white/70 shadow-sm sm:flex">
            <Settings className="h-5 w-5" />
          </Button>

          {user ? (
            isMounted ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-9 w-9 ring-2 ring-white/70">
                  <AvatarImage src={userDisplay.imageUrl ?? ""} alt={userDisplay.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userDisplay.initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )
          ) : (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" className="rounded-full px-5" asChild>
                  <Link href="/sign-in">Đăng nhập</Link>
                </Button>
                <Button className="rounded-full px-5 shadow-[0_16px_30px_-18px_rgba(79,70,229,0.42)]" asChild>
                  <Link href="/sign-up">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Đăng ký
                  </Link>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/70 sm:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userDisplay.imageUrl ?? ""} alt={userDisplay.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userDisplay.initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl border-white/70 bg-white/92 backdrop-blur-xl">
                  <div className="flex items-center gap-2 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userDisplay.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{userDisplay.name}</span>
                      <span className="text-xs text-muted-foreground">{userDisplay.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/sign-in">Đăng nhập</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sign-up">Đăng ký tài khoản</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/70 md:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-white/60 bg-white/84 p-4 backdrop-blur-xl md:hidden">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-full border-white/70 bg-white/92 pl-10"
              />
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-foreground hover:bg-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {!user && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-full" asChild>
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  Đăng nhập
                </Link>
              </Button>
              <Button className="rounded-full" asChild>
                <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
