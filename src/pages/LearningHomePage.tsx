import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import previewDocument from '../../previews/homepage-v1.html?raw';
import { initHomepageInteractions } from '../previews/homepageBehavior';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useCompanionStore } from '../store/companionStore';
import { initDirectoryMotion } from '../ui/directoryMotion.js';

const NodePreview = lazy(() => import('../previews/nodePreview').then(module => ({ default: module.NodePreview })));
const TrainingPreview = lazy(() => import('../previews/TrainingPreview'));
const CaseExperience = lazy(() => import('../components/cases/CaseExperience'));

const previewBody = previewDocument.match(/<body[^>]*>([\s\S]*?)<script\b/i)?.[1];
if (!previewBody) throw new Error('Homepage preview markup is missing');
const siteBase = import.meta.env.BASE_URL;

const formalMarkup = previewBody
  .replaceAll('src="/brand/', `src="${siteBase}brand/`)
  .replaceAll('/previews/curriculum/', `${siteBase}#/lesson/`)
  .replaceAll('/previews/wall-v1.html', `${siteBase}#/lesson/wall/index.html`)
  .replace('class="brand" href="/#/" title="返回当前首页"', 'class="brand" href="#top" title="返回顶部"')
  .replace(/<div class="side-footer">[\s\S]*?<\/div>/, '')
  .replace('<a href="/#/">返回当前版本 ↗</a>', '<a href="#top">返回顶部</a>')
  .replace('<span class="preview-pill">UI 预览 · 方案 01</span>', '')
  .replaceAll('href="/#/', `href="${siteBase}#/`);
const markup = { __html: formalMarkup };

export default function LearningHomePage({ active }: { active: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [modelTarget, setModelTarget] = useState<{ mount: HTMLElement; visual: HTMLElement } | null>(null);
  const [trainingTarget, setTrainingTarget] = useState<HTMLElement | null>(null);
  const [caseTarget, setCaseTarget] = useState<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const loadedStyles = useRef(new Set<string>());
  const [stylesReady, setStylesReady] = useState(false);
  const markStylesheetReady = (name: string) => {
    loadedStyles.current.add(name);
    if (loadedStyles.current.size === 2) setStylesReady(true);
  };

  useLayoutEffect(() => {
    const app = container.current?.querySelector<HTMLElement>('.app');
    if (!app) return;
    const disposeInteractions = initHomepageInteractions(app, { spaAnchors: true });
    document.title = '建筑构造 · 交互式教材';
    return () => {
      disposeInteractions();
    };
  }, []);

  useLayoutEffect(() => {
    if (!active || !stylesReady || !container.current) return;
    return initDirectoryMotion(container.current);
  }, [active, stylesReady]);

  useLayoutEffect(() => {
    if (!active) return;
    const mount = container.current?.querySelector<HTMLElement>('#node-model-root');
    const visual = mount?.closest<HTMLElement>('.node-focus-visual');
    if (mount && visual) setModelTarget(current => current ?? { mount, visual });
    const trainingMount = container.current?.querySelector<HTMLElement>('#training-preview-root');
    if (trainingMount) setTrainingTarget(current => current ?? trainingMount);
    const caseMount = container.current?.querySelector<HTMLElement>('#case-preview-root');
    if (caseMount) setCaseTarget(current => current ?? caseMount);
  }, [active]);

  useLayoutEffect(() => {
    if (!active || !stylesReady || !container.current) return;
    const sections = [...container.current.querySelectorAll<HTMLElement>('.hero-carousel, #introduction, #modules, #principles, #explore')];
    const observer = new IntersectionObserver(entries => {
      const section = entries.find(entry => entry.isIntersecting)?.target;
      if (section) useCompanionStore.getState().setHomeSection(section.id || 'features');
    }, { rootMargin: '-20% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [active, stylesReady]);

  useLayoutEffect(() => {
    const homeContainer = container.current;
    if (!active || !stylesReady || !homeContainer) return;
    document.title = '建筑构造 · 交互式教材';
    const section = new URLSearchParams(location.search).get('section');
    const target = section && ['top', 'introduction', 'modules', 'principles'].includes(section)
      ? homeContainer.querySelector<HTMLElement>(`#${section}`)
      : null;
    // Follow an explicit destination while fonts and previews settle. Stop as
    // soon as the reader interacts, so later layout changes cannot pull them back.
    let following = !!target;
    let positionFrame = 0;
    const alignSection = () => {
      positionFrame = 0;
      if (!following || !target) return;
      const offset = target.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      if (Math.abs(offset) > 1) window.scrollTo({ top: window.scrollY + offset, behavior: 'instant' });
    };
    const scheduleAlignment = () => {
      if (following && !positionFrame) positionFrame = requestAnimationFrame(alignSection);
    };
    const layoutObserver = target ? new ResizeObserver(scheduleAlignment) : null;
    const stopFollowing = () => {
      following = false;
      layoutObserver?.disconnect();
      cancelAnimationFrame(positionFrame);
      window.removeEventListener('wheel', stopFollowing);
      window.removeEventListener('touchstart', stopFollowing);
      window.removeEventListener('pointerdown', stopFollowing);
      window.removeEventListener('keydown', stopFollowing);
    };
    if (target) {
      alignSection();
      layoutObserver?.observe(homeContainer);
      document.fonts.ready.then(scheduleAlignment);
      window.addEventListener('wheel', stopFollowing, { passive: true });
      window.addEventListener('touchstart', stopFollowing, { passive: true });
      window.addEventListener('pointerdown', stopFollowing, { passive: true });
      window.addEventListener('keydown', stopFollowing);
    } else {
      window.scrollTo({ top: lastScrollY.current, behavior: 'instant' });
    }
    const rememberScroll = () => { lastScrollY.current = window.scrollY; };
    window.addEventListener('scroll', rememberScroll, { passive: true });
    return () => {
      stopFollowing();
      window.removeEventListener('scroll', rememberScroll);
    };
  }, [active, location.search, stylesReady]);

  return <>
    <link rel="stylesheet" href={`${siteBase}homepage.css?v=20261015-hero-template`} media={active ? 'all' : 'not all'} onLoad={() => markStylesheetReady('home')} onError={() => markStylesheetReady('home')} />
    <link rel="stylesheet" href={`${siteBase}feature-showcase.css?v=20261015-hero-template`} media={active ? 'all' : 'not all'} onLoad={() => markStylesheetReady('features')} onError={() => markStylesheetReady('features')} />
    <div ref={container} style={{ visibility: stylesReady ? undefined : 'hidden' }} dangerouslySetInnerHTML={markup} />
    {modelTarget && createPortal(<Suspense fallback={<span className="node-model-status" role="status">模型加载中…</span>}><NodePreview visual={modelTarget.visual} /></Suspense>, modelTarget.mount)}
    {trainingTarget && createPortal(<ErrorBoundary fallback={<div className="practice-preview-placeholder" role="alert"><span>互动预览暂不可用</span><a href={`${siteBase}#/games`}>进入作业训练</a></div>}><Suspense fallback={<div className="practice-preview-placeholder" role="status">正在准备互动训练…</div>}><TrainingPreview visual={trainingTarget} /></Suspense></ErrorBoundary>, trainingTarget)}
    {caseTarget && createPortal(<ErrorBoundary fallback={<div className="case-model-placeholder" role="alert"><a href={`${siteBase}#/curriculum/cases/farnsworth-house`}>查看法恩斯沃斯住宅分析</a></div>}><Suspense fallback={<div className="case-model-placeholder" role="status">正在准备建筑案例…</div>}><CaseExperience visual={caseTarget} /></Suspense></ErrorBoundary>, caseTarget)}
  </>;
}
