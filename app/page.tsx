import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">Hosting CRM</h1>
        <p className="text-lg text-muted-foreground text-balance">
          Manage your Netlify domains and ForwardEmail aliases in one unified dashboard
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
