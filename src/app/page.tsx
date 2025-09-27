import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Vehicle Dealership
        </h1>
        <p className="text-center text-gray-600 text-lg mb-8">
          Welcome to our dealership. Site under construction.
        </p>
        
        <div className="flex justify-center space-x-4 mb-12">
          <Link 
            href="/vehicles" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            View Vehicles
          </Link>
          <Link 
            href="/about" 
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            About Us
          </Link>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Phase 2: Added Basic Routing and Navigation
          </p>
        </div>
      </div>
    </main>
  );
}
