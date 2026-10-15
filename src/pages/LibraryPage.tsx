import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { nodesIndex } from '../data/nodesIndex';
import { initDirectoryMotion } from '../ui/directoryMotion.js';

const libraryNodes = nodesIndex.filter(node => node.category !== '案例');
const categories = [
  { id: 'roof', title: '屋顶', description: '从檐口、排水到屋面连接，观察顶部的构造细部。' },
  { id: 'floor', title: '楼地层', description: '观察楼板、阳台与雨篷的层次和连接。' },
  { id: 'wall', title: '墙体', description: '沿墙身、墙脚与洞口，读懂材料之间的连接。' },
  { id: 'stairs', title: '楼梯', description: '对照梯段、平台、台阶与坡道的构造关系。' },
  { id: 'foundation', title: '基础', description: '从基础的不同形式，认识建筑与地面的连接。' },
].map(category => ({ ...category, nodes: libraryNodes.filter(node => node.category === category.title) }));

function NodeCard({ node, returnTo }: { node: typeof libraryNodes[number]; returnTo: string }) {
  const number = String(libraryNodes.indexOf(node) + 1).padStart(2, '0');
  return <Link to={`/node/${node.id}`} state={{ libraryReturnTo: returnTo }} className="directory-card library-node-card" aria-label={`查看${node.title}`}>
    <span className="directory-card-top"><span className="directory-card-number">{number}</span><span className="directory-card-kicker">{node.category} · {node.thumbnail ? '图模对照' : '三维观察'}</span></span>
    <div className="library-node-preview">
      {node.thumbnail ? <img src={node.thumbnail} alt={`${node.title}构造图`} loading="lazy" /> : <div className="library-node-placeholder" aria-hidden="true"><span /><span /><span>三维模型</span></div>}
    </div>
    <div className="library-node-copy"><h3 className="directory-card-title">{node.title}</h3><p className="directory-card-description">{node.description}</p></div>
    <span className="directory-card-footer"><span>{node.status === 'development' ? '查看节点状态' : '打开节点'}</span><span className="directory-card-arrow" aria-hidden="true">→</span></span>
  </Link>;
}

export default function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const results = useRef<HTMLElement>(null);
  const category = categories.some(item => item.id === params.get('category')) ? params.get('category')! : 'all';
  const query = (params.get('q') ?? '').slice(0, 80);
  const filterKey = `${category}:${query}`;
  const previousFilter = useRef(filterKey);
  const terms = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const visibleCategories = categories.filter(item => category === 'all' || item.id === category)
    .map(item => ({ ...item, matches: item.nodes.filter(node => terms.every(term => `${node.title} ${node.description} ${node.category}`.normalize('NFKC').toLocaleLowerCase().includes(term))) }))
    .filter(item => item.matches.length > 0);
  const count = visibleCategories.reduce((total, item) => total + item.matches.length, 0);
  const categoryTitle = categories.find(item => item.id === category)?.title ?? '全部部位';
  const returnTo = `${location.pathname}${location.search}`;

  const updateFilters = (nextCategory: string, nextQuery: string, replace = false) => {
    const next = new URLSearchParams();
    if (nextCategory !== 'all') next.set('category', nextCategory);
    if (nextQuery) next.set('q', nextQuery);
    setParams(next, { replace });
  };

  useEffect(() => { document.title = '构造节点 · 建筑构造'; }, []);
  useEffect(() => root.current ? initDirectoryMotion(root.current) : undefined, [filterKey]);
  useLayoutEffect(() => {
    if (previousFilter.current === filterKey) return;
    previousFilter.current = filterKey;
    if (!results.current || !toolbar.current) return;
    const topbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-topbar-height')) || 76;
    const offset = topbarHeight + toolbar.current.getBoundingClientRect().height + 20;
    const top = results.current.getBoundingClientRect().top;
    // Initial mounts leave scroll restoration to AppLayout on node return.
    if (top < offset) window.scrollTo({ top: window.scrollY + top - offset, behavior: 'instant' });
  }, [filterKey]);

  return <div ref={root} className="site-page library-page">
    <header className="site-page-header site-container library-header">
      <div className="library-heading"><span className="site-eyebrow">NODE LIBRARY</span><h1 className="site-page-title">构造节点</h1></div>
      <div className="library-header-art" aria-hidden="true"><span /><span /><span /></div>
      <p className="site-page-intro">从一处节点，读懂构造。<br />对照图纸、转动模型，观察构件之间的空间关系。</p>
    </header>
    <div className="site-container library-search-row">
      <p className="library-result-count" role="status" aria-live="polite" aria-atomic="true"><strong>{String(count).padStart(2, '0')}</strong><span>个节点<span className="library-result-scope">{query.trim() ? `与“${query.trim()}”相关` : `${categoryTitle} · 图纸与三维`}</span></span></p>
      <div className="library-search"><Search size={18} strokeWidth={1.6} aria-hidden="true" /><label className="sr-only" htmlFor="library-search">搜索构造节点</label><input id="library-search" type="search" value={query} maxLength={80} placeholder="搜索名称或构造做法" onChange={event => updateFilters(category, event.target.value, true)} />{query && <button type="button" aria-label="清除搜索" onClick={() => updateFilters(category, '', true)}><X size={16} aria-hidden="true" /></button>}</div>
    </div>
    <div ref={toolbar} className="library-filter-bar"><nav className="site-container library-category-nav" aria-label="按部位筛选节点">
      {[{ id: 'all', title: '全部', nodes: libraryNodes }, ...categories].map(item => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => updateFilters(item.id, query)}><span>{item.title}</span><span className="library-category-count">{String(item.nodes.length).padStart(2, '0')}</span></button>)}
    </nav></div>
    <main ref={results} className="site-container site-page-main library-results" aria-label="构造节点目录">
      {visibleCategories.length ? visibleCategories.map(item => <section key={item.id} className="library-group" aria-labelledby={`library-${item.id}`}>
        <div className="library-group-heading"><span className="library-group-number" aria-hidden="true">{String(categories.findIndex(group => group.id === item.id) + 1).padStart(2, '0')}</span><div><h2 id={`library-${item.id}`} className="site-section-title">{item.title}</h2><p>{item.description}</p></div><span className="library-group-count">{item.matches.length} 个节点</span></div>
        <div className="directory-grid library-grid">{item.matches.map(node => <NodeCard key={node.id} node={node} returnTo={returnTo} />)}</div>
      </section>) : <section className="site-empty-state library-empty"><span className="site-eyebrow">继续探索</span><h2 className="site-section-title">没有找到相关节点</h2><p className="site-page-intro">试试其他名称或构造做法，也可以切换部位继续浏览。</p><button type="button" className="site-button" onClick={() => updateFilters('all', '', true)}>清除筛选，查看全部节点 <span aria-hidden="true">→</span></button></section>}
    </main>
  </div>;
}
