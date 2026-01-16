import { cookies } from 'next/headers'

const ORG_COOKIE = 'selected_org_id'

export async function setOrgCookie(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ORG_COOKIE, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function getOrgCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(ORG_COOKIE)?.value
}
