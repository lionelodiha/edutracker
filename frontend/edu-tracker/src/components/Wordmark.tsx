/**
 * The EduTracker logo: type only. An upright "Edu" against an italic
 * "Tracker" in the hero headline's violet-to-cyan gradient, with a hairline
 * track underneath that ends in a cyan marker. Colours come from the landing
 * palette where it exists and fall back to the same values everywhere else.
 */
import "./wordmark.css";

type WordmarkProps = { fontSize?: string; animate?: boolean };

export default function Wordmark({ fontSize = "1.7rem", animate = false }: WordmarkProps) {
    return (
        <span className={`ll-word${animate ? " ll-animate" : ""}`} style={{ fontSize }} role="img" aria-label="EduTracker">
            <span aria-hidden="true">Edu<i>Tracker</i></span>
        </span>
    );
}
