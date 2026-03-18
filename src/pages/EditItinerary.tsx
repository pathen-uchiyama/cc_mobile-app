import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ItineraryRibbon from '@/components/ItineraryRibbon';

const EditItinerary = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative">
      {/* Header */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-parchment border-b border-slate-divider px-6 py-4"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg text-foreground">Edit the Plan</h1>
            <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">Drag to rearrange · Locked items stay fixed</p>
          </div>
        </div>
      </motion.header>

      <ItineraryRibbon />
    </div>
  );
};

export default EditItinerary;
