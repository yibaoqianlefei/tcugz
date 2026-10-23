import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import BrandMark from './BrandMark';

interface SiteHeaderProps {
  to?: string;
  label?: string;
  breadcrumb?: string;
  className?: string;
  actions?: ReactNode;
  state?: unknown;
}

export default function SiteHeader({ to = '/', label = '返回学习首页', breadcrumb = '建筑构造 / 学习首页', className = '', actions, state }: SiteHeaderProps) {
  const back = <Link to={to} state={state} className="site-back-link"><span className="site-back-icon" aria-hidden="true">←</span><span>{label}</span></Link>;
  return <header className={`site-subpage-topbar ${className}`}>
    <div className="site-container site-topbar-inner">
      <Link to="/" className="site-subpage-brand" aria-label="建筑构造 · 返回学习首页">
        <BrandMark /><span>{breadcrumb}</span>
      </Link>
      {actions ? <div className="site-topbar-actions">{back}{actions}</div> : back}
    </div>
  </header>;
}
