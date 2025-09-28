export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Auto Dealership. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Phase 3: Layout with Navigation and Footer
          </p>
        </div>
      </div>
    </footer>
  );
}
