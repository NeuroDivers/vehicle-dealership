export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            <div className="space-y-3">
              <p className="text-gray-600">
                <strong>Phone:</strong> (555) 123-4567
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> info@autodealership.com
              </p>
              <p className="text-gray-600">
                <strong>Address:</strong> 123 Main Street, City, State 12345
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
            <div className="space-y-2 text-gray-600">
              <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
              <p>Saturday: 10:00 AM - 5:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Phase 3: Contact page with business information
          </p>
        </div>
      </div>
    </main>
  );
}
