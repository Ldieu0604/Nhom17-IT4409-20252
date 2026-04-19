"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Calendar, FileText, LayoutGrid, Menu, Search, Settings, Users, X } from "lucide-react"

type HeaderProps = {
  user?: {
    name: string
    email: string
    imageUrl?: string | null
    initials: string
  } | null
  searchPlaceholder?: string
}

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard#documents", label: "Tài liệu", icon: FileText },
  { href: "/dashboard#calendar", label: "Lịch", icon: Calendar },
  { href: "/dashboard#workspaces", label: "Nhóm", icon: Users },
]

export function Header({
  user,
  searchPlaceholder = "Tìm kiếm tài liệu, workspace...",
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden text-xl font-bold text-foreground sm:inline-block">
              CoWorkHub
            </span>
            <span className="text-xl font-bold text-foreground sm:hidden">CWH</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden flex-1 items-center justify-center px-6 lg:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder={searchPlaceholder} className="h-9 w-full pl-10 pr-4" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Settings className="h-5 w-5" />
          </Button>

          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Đăng ký</Link>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full sm:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userDisplay.imageUrl ?? ""} alt={userDisplay.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userDisplay.initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
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
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder={searchPlaceholder} className="h-10 w-full pl-10" />
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
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
              <Button variant="outline" asChild>
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  Đăng nhập
                </Link>
              </Button>
              <Button asChild>
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
