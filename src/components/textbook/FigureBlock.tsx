import { useState } from "react";

interface Props {
  src: string;
  alt?: string;
}

export default function FigureBlock({ src, alt }: Props) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <figure className="my-6 rounded-xl border border-hairline bg-surface-soft/50 p-8 text-center">
        <p className="text-xs text-muted-soft">图片加载失败</p>
      </figure>
    );
  }

  return (
    <figure className="my-6 rounded-xl border border-hairline bg-white overflow-hidden">
      <img
        src={src}
        alt={alt ?? ""}
        onError={() => setError(true)}
        className="w-full max-h-[480px] object-contain"
        loading="lazy"
      />
      {alt && (
        <figcaption className="px-4 py-2.5 text-xs text-muted-soft border-t border-hairline/50 bg-surface-soft/30">
          图：{alt}
        </figcaption>
      )}
    </figure>
  );
}
