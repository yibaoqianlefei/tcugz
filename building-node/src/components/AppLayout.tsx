import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Global layout wrapper — sticky nav bar on all non-home pages.
 * Simplified from 02-2: drops Supabase auth; keeps nav chrome.
 */
function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const isAuth = pathname === "/auth";
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, [pathname]);

  function handleBack() {
    navigate(-1);
  }

  return (
    <>
      {!isHome && !isAuth && (
        <nav className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 md:px-10 bg-canvas border-b border-hairline">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-primary transition-colors duration-200 hover:bg-surface-card rounded-lg px-2 py-1 -ml-2"
                  title="返回上一页"
                >
                  <ChevronLeft size={18} strokeWidth={1.5} />
                  <span className="text-sm font-medium">返回</span>
                </button>
                <span className="text-muted-soft select-none">|</span>
              </>
            )}
            <Link
              to="/"
              className="text-sm font-medium text-muted tracking-tight hover:text-primary transition-colors"
            >
              建筑构造交互系统
            </Link>
          </div>
        </nav>
      )}
      <Outlet />
    </>
  );
}

export default AppLayout;
