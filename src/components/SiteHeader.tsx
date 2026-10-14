import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

interface SiteHeaderProps {
  to?: string;
  label?: string;
  breadcrumb?: string;
}

export default function SiteHeader({ to = '/', label = '返回学习首页', breadcrumb = '建筑构造 / 学习首页' }: SiteHeaderProps) {
  return <header className="site-subpage-topbar">
    <div className="site-container site-topbar-inner">
      <Link to="/" className="site-subpage-brand" aria-label="建筑构造 · 返回学习首页">
        <BrandMark /><span>{breadcrumb}</span>
      </Link>
      <Link to={to} className="site-back-link"><span className="site-back-icon" aria-hidden="true">←</span><span>{label}</span></Link>
    </div>
  </header>;
}
