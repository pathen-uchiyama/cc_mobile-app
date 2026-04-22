import ItineraryRibbon from '@/components/ItineraryRibbon';
import PageHeader from '@/components/layout/PageHeader';

const EditItinerary = () => {
  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative">
      <PageHeader
        backTo="/park"
        backLabel="Your day"
        eyebrow="The Plan"
        title="Edit the plan"
        subtitle="Drag to rearrange · Locked items stay fixed."
      />
      <ItineraryRibbon />
    </div>
  );
};

export default EditItinerary;
