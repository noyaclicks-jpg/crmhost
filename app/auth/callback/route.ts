import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { acceptInviteWithSignup } from "@/lib/actions/invites"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token = requestUrl.searchParams.get("token")

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // If there's an invite token, accept the invite
    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await acceptInviteWithSignup(token, user.id)
      }
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}
