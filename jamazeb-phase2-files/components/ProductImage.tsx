import Image from "next/image";

type Props = {
  tone: string;
  label: string;
  /** Real photo. When missing, a tinted placeholder of the same size is shown. */
  src?: string;
  /** How wide the image is on screen, so phones download a smaller file. */
  sizes?: string;
  /** Load immediately: use only for the main image near the top of a page. */
  priority?: boolean;
  className?: string;
};

/**
 * Product and category imagery. With a photo, Next.js serves a compressed,
 * correctly sized WebP/AVIF that lazy-loads; without one, a placeholder keeps
 * the exact same box size so adding photos later causes no layout shift.
 */
export function ProductImage({
  tone,
  label,
  src,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  priority = false,
  className = "",
}: Props) {
  if (src) {
    return (
      <div style={{ backgroundColor: tone }} className={`relative overflow-hidden ${className}`}>
        <Image src={src} alt={label} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  return (
    <div role="img" aria-label={label} style={{ backgroundColor: tone }} className={`flex items-end p-4 ${className}`}>
      <span aria-hidden="true" className="text-xs tracking-[0.12em] text-muted uppercase">
        Photo coming soon
      </span>
    </div>
  );
}
