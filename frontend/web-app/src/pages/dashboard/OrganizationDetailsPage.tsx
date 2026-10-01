import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { getOrganizationByIdEndpointHandler, getOrganizationMembersEndpointHandler, getSemestersEndpointHandler } from "../../api";
import type { OrganizationMemberResponse, OrganizationResponse, SemesterResponse } from "../../api";
import { client } from "../../api/client.gen";
import { API_BASE } from "../../apiBase";
import { readSchoolSetup } from "../../features/cohorts/schoolSetup";
import type { OrganizationContext } from "../../layouts/OrganizationLayout";
import CurrentSessionCard from "../organization/overview/CurrentSessionCard";
import FacultiesStrip from "../organization/overview/FacultiesStrip";
import OverviewHeader from "../organization/overview/OverviewHeader";
import OverviewSkeleton from "../organization/overview/OverviewSkeleton";
import RecentActivity from "../organization/overview/RecentActivity";
import SetupChecklist from "../organization/overview/SetupChecklist";
import StatStrip from "../organization/overview/StatStrip";
import TeamPreview from "../organization/overview/TeamPreview";
import "../organization/overview/overview.css";

function BuildingIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" /><path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" /><path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" /></svg>;
}

export default function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outlet = useOutletContext<OrganizationContext | null>();
  const [org, setOrg] = useState<OrganizationResponse | null>(outlet?.org?.createdAt ? outlet.org : null);
  const [members, setMembers] = useState<OrganizationMemberResponse[] | null>(null);
  const [sessions, setSessions] = useState<SemesterResponse[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Old ?tab= links still point at the former all-in-one page.
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!id || !tab) return;
    const destination = tab === "departments" ? "structure" : tab;
    if (["structure", "faculties", "staff", "settings"].includes(destination)) {
      navigate(`/dashboard/organizations/${id}/${destination}`, { replace: true });
    }
  }, [id, searchParams, navigate]);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setOrg(null);
    setMembers(null);
    setSessions(null);
    client.setConfig({ baseUrl: API_BASE, credentials: "include" });
    try {
      const orgRes = await getOrganizationByIdEndpointHandler({ path: { id } });
      if (orgRes.data?.data) {
        setOrg(orgRes.data.data);
        try { localStorage.setItem(`edutracker.organizationName.${id}`, orgRes.data.data.name); } catch { /* The page still shows the fetched name. */ }
      }
    } catch (error) { console.error("Failed to fetch organization:", error); }
    try {
      const membersRes = await getOrganizationMembersEndpointHandler({ path: { id } });
      if (membersRes.data?.data) setMembers(membersRes.data.data);
    } catch (error) { console.error("Failed to fetch members:", error); }
    try {
      const sessionsRes = await getSemestersEndpointHandler({ query: { organizationId: id } });
      if (sessionsRes.data?.data) setSessions(sessionsRes.data.data);
    } catch (error) { console.error("Failed to fetch sessions:", error); }
    setLoading(false);
  }, [id]);

  useEffect(() => { queueMicrotask(() => void fetchDetails()); }, [fetchDetails]);

  if (loading) return <OverviewSkeleton />;
  if (!org) return <div className="dz-page"><div className="dz-card dz-empty"><span className="dz-empty-icon"><BuildingIcon /></span><div className="dz-empty-title">Organization not found</div><div className="dz-empty-text">This school may have been removed or you may not have access.</div><button className="dz-btn-outline" style={{ marginTop: "1rem" }} onClick={() => navigate("/dashboard/organizations")}>Back to Organizations</button></div></div>;

  const setup = readSchoolSetup(org.id);
  const units = setup?.structure.units ?? [];
  const faculties = units.filter(unit => unit.parent === null);
  const byRole = (role: OrganizationMemberResponse["role"]) => members?.filter(member => member.role === role) ?? [];
  const owner = byRole("Owner")[0] ?? null;
  const teachers = byRole("Teacher");
  const students = byRole("Student");
  const staffAdmins = members?.filter(member => !["Owner", "Teacher", "Student"].includes(member.role)) ?? [];
  const currentSession = [...(sessions ?? [])].sort((a, b) => Number(b.startYear) - Number(a.startYear))[0] ?? null;
  const base = `/dashboard/organizations/${org.id}`;
  const hasStructure = !!setup && units.length > 0;
  const hasSession = sessions ? sessions.length > 0 : null;
  const allReady = hasStructure && hasSession && teachers.length > 0 && students.length > 0;
  const checklist = allReady ? null : <SetupChecklist base={base} hasStructure={hasStructure} hasSession={hasSession} hasTeachers={members ? teachers.length > 0 : null} hasStudents={members ? students.length > 0 : null} />;

  return <div className="dz-page ov-page">
    <OverviewHeader org={org} model={setup?.model ?? null} currentSession={currentSession} owner={owner} base={base} setupComplete={!checklist} />
    <StatStrip base={base} faculties={faculties.length} teachers={members ? teachers.length : null} students={members ? students.length : null} staffAdmins={members ? staffAdmins.length : null} sessions={sessions?.length ?? null} />
    {checklist}
    <div className="ov-columns">
      <div className="ov-column"><FacultiesStrip base={base} faculties={faculties} units={units} /><RecentActivity org={org} members={members} sessions={sessions} /></div>
      <div className="ov-column"><CurrentSessionCard base={base} sessions={sessions} currentSession={currentSession} /><TeamPreview base={base} members={members} /></div>
    </div>
  </div>;
}
