// Placeholder for product photography. Keeps the exact box size real images
// will use, so swapping in next/image later causes no layout shift.

type Props = {
  tone: string;
  label: string;
  className?: string;
};

export function ProductImage({ tone, label, className = "" }: Props) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{ backgroundColor: tone }}
      className={`flex items-end p-4 ${className}`}
    >
      <span aria-hidden="true" className="text-xs tracking-[0.12em] text-muted uppercase">
        Photo coming soon
      </span>
    </div>
  );
}
