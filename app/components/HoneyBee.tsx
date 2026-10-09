/*
 * HoneyBee — the brand's watercolor honeybee illustration (the real asset
 * Sydney provided, matching thewinsomelife.com). Rendered as a transparent PNG
 * so it drops cleanly onto the logo lockup and the hero. Position / rotation /
 * animation are applied by the caller via className + style.
 *
 * The source art points head-up-left; `slant` rotates it (negative = tilt
 * left, matching the current-site logo's ~20° lean).
 */
export function HoneyBee({
  size = 40,
  slant = 0,
  className = "",
  style,
  alt = "",
}: {
  size?: number;
  /** degrees; negative tilts the top of the bee to the left */
  slant?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}) {
  return (
    <img
      src="/honeybee.png"
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
      style={{
        ...(slant ? {transform: `rotate(${slant}deg)`} : {}),
        ...style,
      }}
    />
  );
}

export default HoneyBee;
