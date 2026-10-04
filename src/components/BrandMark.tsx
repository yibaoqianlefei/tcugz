/** Decorative mark beside the site's visible name. */
export default function BrandMark() {
  return <img className="site-brand-mark" src={`${import.meta.env.BASE_URL}brand/logo.svg`} width="40" height="40" alt="" aria-hidden="true" />;
}
