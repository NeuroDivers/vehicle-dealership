import dynamic from 'next/dynamic';

const EditVehicleClient = dynamic(() => import('./EditVehicleClient'), {
  ssr: false,
});

export function generateStaticParams() {
  // Return empty array for dynamic handling
  return [];
}

export default function EditVehiclePage() {
  return <EditVehicleClient />;
}
