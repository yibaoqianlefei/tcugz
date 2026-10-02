import { createRoot } from 'react-dom/client';
import { NodePreview } from './nodePreview';

const mount = document.getElementById('node-model-root');
const visual = mount?.closest<HTMLElement>('.node-focus-visual');
if (mount && visual) createRoot(mount).render(<NodePreview visual={visual} />);
