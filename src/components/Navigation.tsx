import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Auto Dealership
          </Link>
          
          <div className="flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            <Link href="/vehicles" className="text-gray-700 hover:text-blue-600 transition">
              Vehicles
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
