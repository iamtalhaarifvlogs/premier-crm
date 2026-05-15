// app/test/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestPage() {
  let leads: any[] = [];
  let error: string | null = null;
  let rawResponse: any = null;

  try {
    const API_URL = "https://mlkqulvd22.execute-api.us-east-1.amazonaws.com/default/crm_data?TableName=tbl_leads";

    const response = await fetch(API_URL, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    rawResponse = await response.json();
    leads = Array.isArray(rawResponse) ? rawResponse : rawResponse.Items || [];

  } catch (err: any) {
    error = err.message || "Failed to fetch data";
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Direct API Test Page</h1>

      {error ? (
        <div className="bg-red-100 border-2 border-red-600 text-red-700 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">❌ Error</h2>
          <p className="whitespace-pre-wrap text-lg">{error}</p>
        </div>
      ) : leads.length > 0 ? (
        <div className="bg-green-100 border-2 border-green-600 text-green-700 p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold">✅ SUCCESS</h2>
          <p className="text-3xl">Loaded <strong>{leads.length}</strong> leads</p>
        </div>
      ) : (
        <div className="bg-yellow-100 border-2 border-yellow-600 text-yellow-700 p-6 rounded-2xl">
          No leads returned from API
        </div>
      )}

      {/* Leads Table */}
      {leads.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Phone</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Stage</th>
                <th className="border p-3 text-left">Budget</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="border p-3">{lead.name || "—"}</td>
                  <td className="border p-3">{lead.phone || "—"}</td>
                  <td className="border p-3">{lead.email || "—"}</td>
                  <td className="border p-3">{lead.stage || "—"}</td>
                  <td className="border p-3">${Number(lead.budget || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw Response */}
      {rawResponse && (
        <div className="mt-10">
          <h3 className="font-semibold mb-3">Raw API Response:</h3>
          <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-auto text-xs max-h-96">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}