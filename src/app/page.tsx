import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Auto Dealership
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find your perfect vehicle today
          </p>
          
          <Link 
            href="/vehicles" 
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Our Inventory
          </Link>
        </div>
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold mb-2">Quality Vehicles</h3>
            <p className="text-gray-600">Hand-picked selection of the finest cars</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
            <p className="text-gray-600">Competitive pricing on all models</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">Excellent Service</h3>
            <p className="text-gray-600">Customer satisfaction is our priority</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Phase 3: Complete layout with navigation and footer
          </p>
        </div>
      </div>
    </main>
  );
}
