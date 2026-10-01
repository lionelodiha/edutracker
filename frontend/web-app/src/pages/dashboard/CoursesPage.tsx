import { useParams, useNavigate } from "react-router-dom";
import CoursesList from "../organization/CoursesList";

export default function CoursesPage() {
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
                    <h1 className="dz-page-title">Courses</h1>
                    <p className="dz-page-sub">This school&apos;s course catalog.</p>
                </div>
            </div>
            <CoursesList organizationId={organizationId} />
        </div>
    );
}
