// Static data for now - will be replaced with database later
const vehicles = [
  { id: '1', make: 'Toyota', model: 'Camry', year: 2023, price: 28500, odometer: 15000, bodyType: 'Sedan', color: 'Silver' },
  { id: '2', make: 'Honda', model: 'CR-V', year: 2022, price: 32000, odometer: 25000, bodyType: 'SUV', color: 'Black' },
  { id: '3', make: 'Ford', model: 'F-150', year: 2021, price: 45000, odometer: 35000, bodyType: 'Truck', color: 'Blue' },
  { id: '4', make: 'Tesla', model: 'Model 3', year: 2023, price: 42000, odometer: 5000, bodyType: 'Sedan', color: 'White' },
  { id: '5', make: 'Chevrolet', model: 'Silverado', year: 2022, price: 48000, odometer: 20000, bodyType: 'Truck', color: 'Red' },
  { id: '6', make: 'BMW', model: 'X5', year: 2021, price: 55000, odometer: 30000, bodyType: 'SUV', color: 'Gray' },
];

export default function VehiclesPage() {

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Vehicles</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <div className="text-sm text-gray-600 mb-3">
                <p>{vehicle.color} • {vehicle.bodyType}</p>
                <p>{vehicle.odometer.toLocaleString()} km</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${vehicle.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Phase 4: Dynamic data with API routes
          </p>
        </div>
      </div>
    </main>
  );
}
