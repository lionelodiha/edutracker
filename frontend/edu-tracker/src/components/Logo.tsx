type LogoMarkProps = {
    size?: number;
    title?: string;
    /** Tile color. Defaults to brand indigo; pass green inside the dashboard. */
    fill?: string;
};

/**
 * EduTracker brand mark: an ascent route. A path rises from a start node,
 * through a waypoint ring, to an arrowhead: progress through the academic year.
 * Solid colors only, geometric shapes, legible down to favicon size.
 */
export default function LogoMark({ size = 32, title = "EduTracker logo", fill = "#6366F1" }: LogoMarkProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            role="img"
            aria-label={title}
            style={{ flexShrink: 0, display: "block" }}
        >
            <rect width="32" height="32" rx="8" fill={fill} />
            <path
                d="M8 23 L14 17 L18 19.5 L23.5 13"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.9 12 H24.5 V15.6"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="14" cy="17" r="2.6" fill={fill} stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="8" cy="23" r="3" fill="#FFFFFF" />
        </svg>
    );
}
