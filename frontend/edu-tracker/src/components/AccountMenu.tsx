import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserIcon, LogOutIcon } from "./icons";

type AccountMenuProps = {
    displayName: string;
    userName?: string;
    initials: string;
    onLogout: () => void;
};

export default function AccountMenu({ displayName, userName, initials, onLogout }: AccountMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open ]);

    return (
        <div className="dz-account-wrap" ref={ref}>
            <button
                type="button"
                className="dz-user-chip"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                style={{ cursor: "pointer", fontFamily: "inherit" }}
            >
                <div className="dz-avatar" style={{ width: 36, height: 36, fontSize: "0.8rem" }}>
                    {initials}
                </div>
                <span className="dz-user-meta">
                    <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.25 }}>
                        {displayName}
                    </span>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.25 }}>
                        @{userName}
                    </span>
                </span>
                <span aria-hidden="true" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>▾</span>
            </button>
            {open && (
                <div className="dz-account-menu" role="menu">
                    <Link
                        to="/dashboard/profile"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                    >
                        <UserIcon />
                        <span>Profile</span>
                    </Link>
                    <button type="button" role="menuitem" onClick={onLogout}>
                        <LogOutIcon />
                        <span>Sign out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
