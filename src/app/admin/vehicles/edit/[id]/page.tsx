import EditVehicleClient from './EditVehicleClient';

export async function generateStaticParams() {
  // Return empty array - this tells Next.js to handle this route dynamically
  // even though we're using static export
  return [];
}

export default function EditVehiclePage() {
  return <EditVehicleClient />;
}
