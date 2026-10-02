export default function SectionPageHeader({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) {
  return <header className="site-page-header mx-auto w-full max-w-6xl px-6 md:px-10">
    <span className="site-eyebrow">{eyebrow}</span>
    <h1 className="site-page-title">{title}</h1>
    <p className="site-page-intro">{description}</p>
  </header>;
}
