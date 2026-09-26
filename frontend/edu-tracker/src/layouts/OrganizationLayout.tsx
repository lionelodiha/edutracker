import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { getOrganizationByIdEndpointHandler } from "../api";
import { client } from "../api/client.gen";
import type { OrganizationResponse } from "../api";
import { API_BASE } from "../apiBase";
import "../styles/workspace.css";
import {
    HomeIcon,
    CalendarIcon,
    UsersIcon,
    SettingsIcon,
} from "../components/icons";

export type OrganizationContext = {
    org: OrganizationResponse | null;
};

export default function OrganizationLayout() {
    const { id } = useParams<{ id: string }>();
    const { pathname } = useLocation();
    const [org, setOrg] = useState<OrganizationResponse | null>(null);

    useEffect(() => {
        if (!id) return;
        // Org name cache so the sidebar shows instantly on revisit.
        try {
            const cached = localStorage.getItem(`edutracker.organizationName.${id}`);
            if (cached) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setOrg((prev) =>
                    prev ?? ({ id, name: cached } as OrganizationResponse),
                );
            }
        } catch {
            /* Name remains visible once loaded. */
        }
        client.setConfig({ baseUrl: API_BASE, credentials: "include" });
        getOrganizationByIdEndpointHandler({ path: { id } })
            .then((res) => {
                if (res.data?.data) {
                    setOrg(res.data.data);
                    try {
                        localStorage.setItem(
                            `edutracker.organizationName.${id}`,
                            res.data.data.name,
                        );
                    } catch {
                        /* Name remains visible in this page. */
                    }
                }
            })
            .catch(() => {});
    }, [id]);

    const base = `/dashboard/organizations/${id}`;
    // Faculty workspaces are reached from Academic Structure, so they highlight it too.
    const structureActive = /\/(structure|sessions|semesters|courses|classes|faculties)(\/|$)/.test(pathname);

    const ORG_NAV = [
        { to: base, label: "Overview", icon: <HomeIcon />, end: true as const, forceActive: false },
        { to: `${base}/structure`, label: "Academic Structure", icon: <CalendarIcon />, end: undefined, forceActive: structureActive },
        { to: `${base}/staff`, label: "Staff & Teachers", icon: <UsersIcon />, end: undefined, forceActive: false },
        { to: `${base}/settings`, label: "School Settings", icon: <SettingsIcon />, end: undefined, forceActive: false },
    ];

    return (
        <div className="dz-org-shell">
            <aside className="dz-sidebar dz-org-sidebar">
                <Link to="/dashboard" className="dz-org-back">← Back to dashboard</Link>
                <div className="dz-org-name">{org?.name ?? "Loading…"}</div>
                <nav>
                    <div className="dz-nav-label">Menu</div>
                    {ORG_NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `dz-nav-link ${isActive || item.forceActive ? "active" : ""}`}
                        >
                            {item.icon}<span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <div className="dz-org-content">
                <Outlet context={{ org } satisfies OrganizationContext} />
            </div>
        </div>
    );
}
