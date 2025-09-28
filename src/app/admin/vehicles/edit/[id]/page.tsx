import EditVehicleClient from './EditVehicleClient';

export function generateStaticParams() {
  // Return empty array to prevent static generation but allow dynamic routing
  return [];
}

export default function EditVehiclePage() {
  return <EditVehicleClient />;
}
