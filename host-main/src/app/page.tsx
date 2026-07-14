/**
 * HOME PAGE (/)
 * Landing page with login and dashboard access
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Host</h1>
        <p className="text-gray-600 mt-2">Host dashboard access</p>
        <div className="mt-6 flex flex-col gap-3">
          <a href="/login" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Host Login</a>
          <a href="/dashboard" className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50">Go to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
