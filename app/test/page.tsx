// app/test/page.tsx
import { getLeads } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TestPage() {
  let leads: any[] = []
  let error: string | null = null
  let rawData: any = null

  try {
    console.log("=== TEST PAGE: Starting fetch ===")
    leads = await getLeads()
    console.log(`=== TEST PAGE: Successfully got ${leads.length} leads ===`)
  } catch (err: any) {
    console.error("=== TEST PAGE ERROR ===", err)
    error = err.message || "Unknown error"
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">CRM API Test Page</h1>

      {error && (
        <div className="bg-red-100 border-2 border-red-600 text-red-700 p-6 rounded-2xl mb-8">
          <h2 className="text-xl font-bold mb-2">❌ Fetch Error</h2>
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {!error && leads.length > 0 && (
        <div className="bg-green-100 border-2 border-green-600 text-green-700 p-6 rounded-2xl mb-8">
          <h2 className="text-xl font-bold">✅ SUCCESS</h2>
          <p className="text-2xl">Loaded <strong>{leads.length}</strong> leads</p>
        </div>
      )}

      {/* Raw Data */}
      {leads.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Stage</th>
                <th className="border p-3 text-left">Budget</th>
                <th className="border p-3 text-left">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="border p-3">{lead.id}</td>
                  <td className="border p-3 font-medium">{lead.name}</td>
                  <td className="border p-3">{lead.stage}</td>
                  <td className="border p-3">${lead.budget}</td>
                  <td className="border p-3">{lead.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leads.length === 0 && !error && (
        <div className="text-center py-20 text-gray-500">
          No leads returned from API
        </div>
      )}
    </div>
  )
}
