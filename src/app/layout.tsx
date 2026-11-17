import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AboutDialogs, AboutFooter } from "@/components/about/AboutDialogs";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "VoteMe — decidam juntos", template: "%s · VoteMe" },
  description: "Crie uma votação em segundos e mande o link. Ninguém precisa de conta pra votar.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#131211" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans">
        <MotionProvider>
        <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-5 pb-2">
          <Link href="/" className="group flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-accent-ink transition-transform duration-300 ease-out-expo group-hover:-rotate-6 group-hover:scale-110">
              ✓
            </span>
            VoteMe
          </Link>
          <Link href="/nova" className="text-sm font-semibold text-accent hover:underline">
            + Nova votação
          </Link>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-10">{children}</main>
        <AboutFooter />
        <AboutDialogs />
        </MotionProvider>
      </body>
    </html>
  );
}
