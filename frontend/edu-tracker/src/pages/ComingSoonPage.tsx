import { Link } from "react-router-dom";

type Props = {
    title: string;
    description?: string;
    backTo?: string;
    backLabel?: string;
};

export default function ComingSoonPage({
    title,
    description = "This area is waiting on backend endpoints. Once they ship it will be wired up to real data.",
    backTo = "/",
    backLabel = "← Back to Homepage",
}: Props) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.5rem",
                padding: "2rem",
                background: "var(--bg-primary)",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "var(--grad-brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(99,102,241,0.35)",
                }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </div>

            <div style={{ maxWidth: 520 }}>
                <div
                    style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        marginBottom: "0.5rem",
                    }}
                >
                    Coming Soon
                </div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                    {title}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.6 }}>
                    {description}
                </p>
            </div>

            <Link to={backTo} className="btn btn-secondary btn-sm">
                {backLabel}
            </Link>
        </div>
    );
}
