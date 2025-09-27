export default function VehiclesPage() {
  const mockVehicles = [
    { id: 1, make: 'Toyota', model: 'Camry', year: 2023, price: 28500 },
    { id: 2, make: 'Honda', model: 'CR-V', year: 2022, price: 32000 },
    { id: 3, make: 'Ford', model: 'F-150', year: 2021, price: 45000 },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Vehicles</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-2xl font-bold text-green-600">
                ${vehicle.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Phase 2: Basic Routing - Testing vehicle listing
          </p>
        </div>
      </div>
    </main>
  );
}
