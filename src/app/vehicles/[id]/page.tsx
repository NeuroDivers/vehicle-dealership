import VehicleRedirect from './VehicleRedirect';

// Generate static params for SEO and initial load
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
  ];
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  // Simply redirect to the new detail page with query parameters
  return <VehicleRedirect id={params.id} />;
}
