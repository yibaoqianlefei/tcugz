import { Link, useLocation } from 'react-router-dom';
import { curriculumLearning, getNodeLearningContext, getNodeLearningContexts, learningRoute } from '../../utils/curriculumLearning';
import '../../styles/wall-learning.css';

/** The course, independent explorer and companion share one teaching relation. */
export default function NodeLearningContextPanel({ nodeId }: { nodeId?: string }) {
  const location = useLocation();
  const context = getNodeLearningContext(nodeId, location.search);
  if (!context) return null;
  const related = getNodeLearningContexts(nodeId).filter(item => item.knowledgeId !== context.knowledgeId);
  const links = [...new Set([...context.relatedPrinciples, ...context.applications])];
  return <section className="wall-node-learning" aria-label="本节点的教材知识">
    <small>本节点要解释的问题</small>
    <p>{context.question}</p>
    <Link to={learningRoute(context)}>教材 · {context.lessonTitle} ↗</Link>
    <details>
      <summary>观察后应能说明什么</summary>
      <p>{context.task}</p>
      <p>{context.principle}</p>
      <p>{context.boundary}</p>
    </details>
    {(related.length > 0 || links.length > 0) && <details><summary>关联课程与实践</summary>
      {related.map(item => <p key={item.knowledgeId}><Link to={learningRoute(item)}>{item.lessonTitle} ↗</Link></p>)}
      {links.map(key => curriculumLearning.lessons[key] && <p key={key}><Link to={`/lesson/${curriculumLearning.lessons[key].path}`}>{curriculumLearning.lessons[key].title} ↗</Link></p>)}
    </details>}
  </section>;
}
