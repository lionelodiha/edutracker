import { useParams, useNavigate } from "react-router-dom";
import SessionsList from "../organization/SessionsList";

export default function SemestersPage() {
    const { id: organizationId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!organizationId) return null;

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <div className="dz-crumb">
                        <button className="dz-pill-btn" onClick={() => navigate(`/dashboard/organizations/${organizationId}`)}>← School</button>
                    </div>
                    <h1 className="dz-page-title">Sessions</h1>
                    <p className="dz-page-sub">Academic years and terms.</p>
                </div>
            </div>
            <SessionsList organizationId={organizationId} />
        </div>
    );
}
