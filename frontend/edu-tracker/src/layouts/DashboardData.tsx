/* eslint-disable react-refresh/only-export-components -- context hook + provider live together by design */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
    getOrganizationsEndpointHandler,
    getCurrentUserSessionsEndpointHandler,
    getUserInvitesEndpointHandler,
    acceptOrganizationInviteEndpointHandler,
    rejectOrganizationInviteEndpointHandler,
} from "../api";
import { client } from "../api/client.gen";
import type {
    OrganizationListItemResponse,
    SessionData,
    UserOrganizationInviteResponse,
} from "../api";
import { getApiBaseUrl } from "../config";

export type DashboardData = {
    orgs: OrganizationListItemResponse[];
    sessions: SessionData[];
    invites: UserOrganizationInviteResponse[];
    orgsLoading: boolean;
    sessionsLoading: boolean;
    invitesLoading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    respondingInvite: string | null;
    respondInvite: (inviteId: string, action: "accept" | "reject") => Promise<void>;
};

const DashboardDataContext = createContext<DashboardData | null>(null);

export function useDashboardData() {
    const ctx = useContext(DashboardDataContext);
    if (!ctx) throw new Error("useDashboardData must be used within DashboardDataProvider");
    return ctx;
}

/* Fetched once for the sidebar badge, topbar search, and all dashboard pages. */
export function DashboardDataProvider({ children }: { children: ReactNode }) {
    const [orgs, setOrgs] = useState<OrganizationListItemResponse[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [invites, setInvites] = useState<UserOrganizationInviteResponse[]>([]);
    const [orgsLoading, setOrgsLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [invitesLoading, setInvitesLoading] = useState(true);
    const [respondingInvite, setRespondingInvite] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        client.setConfig({ baseUrl: getApiBaseUrl(), credentials: "include" });

        getOrganizationsEndpointHandler()
            .then((r) => { if (r.data?.data) setOrgs(r.data.data); })
            .catch(() => {})
            .finally(() => setOrgsLoading(false));

        getCurrentUserSessionsEndpointHandler()
            .then((r) => { if (r.data?.data) setSessions(r.data.data); })
            .catch(() => {})
            .finally(() => setSessionsLoading(false));

        getUserInvitesEndpointHandler()
            .then((r) => { if (r.data?.data) setInvites(r.data.data); })
            .catch(() => {})
            .finally(() => setInvitesLoading(false));
    }, []);

    const respondInvite = async (inviteId: string, action: "accept" | "reject") => {
        setRespondingInvite(inviteId);
        try {
            if (action === "accept") {
                await acceptOrganizationInviteEndpointHandler({ path: { inviteId } });
                getOrganizationsEndpointHandler()
                    .then((r) => { if (r.data?.data) setOrgs(r.data.data); })
                    .catch(() => {});
            } else {
                await rejectOrganizationInviteEndpointHandler({ path: { inviteId } });
            }
            setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        } catch (err) {
            console.error("Failed to respond to invite", err);
        }
        setRespondingInvite(null);
    };

    const value: DashboardData = {
        orgs, sessions, invites,
        orgsLoading, sessionsLoading, invitesLoading,
        searchQuery, setSearchQuery,
        respondingInvite, respondInvite,
    };

    return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}
