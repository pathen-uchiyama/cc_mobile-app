import { useNavigate } from 'react-router-dom';
import OnboardingWizard from '@/components/OnboardingWizard';

const PlanWizard = () => {
  const navigate = useNavigate();

  return (
    <OnboardingWizard onComplete={() => navigate('/park')} />
  );
};

export default PlanWizard;
