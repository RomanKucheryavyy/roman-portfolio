import { getAppStoreFacts, siteAppStoreId } from '@/lib/app-store'

export const revalidate = 21600 // 6h, as APP_STORE_REVALIDATE; Next needs the literal here

/**
 * The FUBC Coffee app's live App Store rating, count and version, for client
 * components (the Credentials record row). Always 200: on failure every field
 * is null and the UI renders nothing.
 */
export async function GET() {
  return Response.json(await getAppStoreFacts(siteAppStoreId()))
}
