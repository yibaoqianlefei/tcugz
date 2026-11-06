interface Props {
  src: string;
  alt: string;
  openOriginal?: boolean;
  displaySrc?: string;
  fitWidth?: boolean;
}

/** Shared fit rule for every section drawing, independent of its aspect ratio. */
export default function CenteredDiagramImage({ src, alt, openOriginal = false, displaySrc = src, fitWidth = false }: Props) {
  const image = <img src={displaySrc} alt={alt} className={fitWidth ? "block h-auto w-full" : "block h-full w-full object-contain rounded-xl"} />;

  return openOriginal ? (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      title="在新标签页查看原图"
      className={fitWidth ? "block w-full max-w-[620px] mx-auto" : "flex h-full w-full items-center justify-center"}
    >
      {image}
    </a>
  ) : image;
}
