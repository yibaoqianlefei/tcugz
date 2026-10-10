import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanionStore } from '../../store/companionStore';
import { useNodeStore } from '../../store/nodeStore';
import { useTrainingStore } from '../../store/trainingStore';
import { getNodeDefinition } from '../../data/nodeDefinitions';
import { getCaseStudy, getCaseTopic, featuredCase } from '../../data/caseStudies';
import { trainingModes, trainingQuestions } from '../../data/training';
import { canonicalName } from '../../utils/nameUtils';
import type { CompanionContext } from '../../companion/types';

/** This bridge subscribes to semantic selection only, never animation frames or hover. */
export default function CompanionContextBridge() {
  const { pathname, search } = useLocation();
  const selectedObject = useNodeStore(state => state.selectedObject);
  const variantId = useNodeStore(state => state.selectedVariantId);
  const progress = useTrainingStore(state => state.progress);
  const homeNodeId = useCompanionStore(state => state.homeNodeId);
  const homeSlide = useCompanionStore(state => state.homeSlide);
  const homeSection = useCompanionStore(state => state.homeSection);
  const detail = useCompanionStore(state => state.detail);
  useEffect(() => {
    const onSlide = (event: Event) => useCompanionStore.getState().setHomeSlide((event as CustomEvent<number>).detail);
    window.addEventListener('preview-hero-change', onSlide);
    return () => window.removeEventListener('preview-hero-change', onSlide);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(search);
    let context: CompanionContext = { kind: 'other', route: pathname, title: ({ '/library': '构造节点', '/games': '作业训练', '/data': '学习数据', '/ai': '构造伙伴', '/ai-extend': '构造伙伴', '/resources': '学习资源', '/curriculum/cases': '案例应用' } as Record<string, string>)[pathname] ?? '建筑构造' };
    if (pathname === '/') {
      const node = getNodeDefinition(homeNodeId);
      context = homeSection !== 'features'
        ? { kind: 'home', route: '/', title: `学习首页 · ${({ introduction: '建筑绪论', modules: '构造基础', principles: '构造原理', explore: '探索与实践' } as Record<string, string>)[homeSection] ?? '学习导航'}` }
        : homeSlide === 1
        ? { kind: 'case', route: '/', title: featuredCase.title, caseId: featuredCase.id }
        : homeSlide === 2
          ? { kind: 'home', route: '/', title: '作业训练预览' }
          : { kind: 'home', route: '/', title: node?.title ?? '学习首页', nodeId: node?.id };
    } else if (pathname.startsWith('/node/')) {
      const node = getNodeDefinition(pathname.slice('/node/'.length));
      const scoped = selectedObject?.split('::');
      const objectName = scoped?.at(-1);
      const actualVariant = scoped && scoped.length > 1 ? scoped[0] : variantId ?? undefined;
      const card = actualVariant ? node?.variants?.find(variant => variant.id === actualVariant)?.componentKnowledge?.find(card => card.objectName === objectName || card.aliases?.includes(objectName ?? '')) : objectName ? node?.layerConfig?.getLayerInfo(objectName) ?? node?.layerConfig?.layers.find(layer => [layer.objectName, ...(layer.aliases ?? [])].some(name => canonicalName(name, node?.model?.groups) === canonicalName(objectName, node?.model?.groups))) : undefined;
      context = { kind: 'node', route: pathname, title: node?.title ?? '未找到节点', nodeId: node?.id, variantId: actualVariant, objectName: card?.objectName, objectTitle: card && ('name' in card ? card.name : card.title) };
    } else if (pathname.startsWith('/lesson/')) {
      context = detail?.route === pathname ? detail : { kind: 'course', route: pathname, title: '课程章节', coursePath: pathname.slice(8) };
    } else if (pathname.startsWith('/curriculum/cases/')) {
      const study = getCaseStudy(pathname.split('/').at(-1));
      const topic = study && getCaseTopic(study, params.get('topic'));
      context = { kind: 'case', route: pathname + search, title: study?.title ?? '案例应用', caseId: study?.id, topicId: topic?.id };
    } else if (pathname.startsWith('/games/')) {
      const mode = pathname.split('/').at(-1);
      const question = trainingQuestions.find(question => question.mode === mode && question.id === params.get('question')) ?? trainingQuestions.find(question => question.mode === mode && question.id === progress.current[mode ?? '']) ?? trainingQuestions.find(question => question.mode === mode);
      context = question ? { kind: 'training', route: pathname + search, title: `${trainingModes.find(item => item.id === mode)?.title} · ${question.title}`, questionId: question.id, submitted: progress.drafts[question.id]?.submitted ?? false } : context;
    }
    useCompanionStore.getState().setContext(context);
  }, [pathname, search, selectedObject, variantId, progress, homeNodeId, homeSlide, homeSection, detail]);
  return null;
}
