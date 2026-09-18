import LogoMark from "./Logo";

type LogoLockupProps = {
    markSize?: number;
    markFill?: string;
    fontSize?: string;
    color?: string;
    gap?: string;
    caption?: string;
    title?: string;
};

/**
 * Full brand lockup: mark plus a serif wordmark set in Newsreader to match
 * the editorial headlines. One component so the wordmark is identical
 * everywhere. Caption is for the dashboard sidebar ("Platform").
 */
export default function Logo({
    markSize = 32,
    markFill,
    fontSize = "1.1rem",
    color = "var(--text-primary)",
    gap = "0.6rem",
    caption,
    title = "EduTracker logo",
}: LogoLockupProps) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap }}>
            <LogoMark size={markSize} title={title} fill={markFill} />
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span
                    className="font-display"
                    style={{ fontSize, fontWeight: 600, color, letterSpacing: "0" }}
                >
                    EduTracker
                </span>
                {caption && (
                    <span
                        style={{
                            fontSize: "0.59rem",
                            color: "rgba(255,255,255,0.25)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            marginTop: "0.1rem",
                        }}
                    >
                        {caption}
                    </span>
                )}
            </span>
        </span>
    );
}
