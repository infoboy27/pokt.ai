export default function SimpleEndpointsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Endpoints Test</h1>
      <p className="mb-4">This page should load without any JavaScript issues.</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800 mb-2">API Test</h2>
        <p className="text-blue-700 mb-2">
          Testing if the API endpoint works: <code>/api/endpoints?orgId=org_current_user</code>
        </p>
        <p className="text-blue-700">
          If you can see this page, the basic Next.js routing is working.
        </p>
      </div>
      
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Manual Test</h3>
        <p className="text-sm text-gray-600 mb-2">
          Open browser console and run this JavaScript:
        </p>
        <pre className="bg-gray-100 p-3 rounded text-sm">
{`fetch('/api/endpoints?orgId=org_current_user')
  .then(res => res.json())
        </pre>
      </div>
    </div>
  );
}



