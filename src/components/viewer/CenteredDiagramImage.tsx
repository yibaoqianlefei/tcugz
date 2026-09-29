interface Props {
  src: string;
  alt: string;
  openOriginal?: boolean;
}

/** Shared fit rule for every section drawing, independent of its aspect ratio. */
export default function CenteredDiagramImage({ src, alt, openOriginal = false }: Props) {
  const image = <img src={src} alt={alt} className="block h-full w-full object-contain rounded-xl" />;

  return openOriginal ? (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      title="在新标签页查看原图"
      className="flex h-full w-full items-center justify-center"
    >
      {image}
    </a>
  ) : image;
}
