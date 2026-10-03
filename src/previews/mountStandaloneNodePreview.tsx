import { createRoot } from 'react-dom/client';
import { NodePreview } from './nodePreview';
import TrainingPreview from './TrainingPreview';
import CaseExperience from '../components/cases/CaseExperience';

const mount = document.getElementById('node-model-root');
const visual = mount?.closest<HTMLElement>('.node-focus-visual');
if (mount && visual) createRoot(mount).render(<NodePreview visual={visual} />);
const trainingMount = document.getElementById('training-preview-root');
if (trainingMount) createRoot(trainingMount).render(<TrainingPreview visual={trainingMount} />);
const caseMount = document.getElementById('case-preview-root');
if (caseMount) createRoot(caseMount).render(<CaseExperience visual={caseMount} />);
