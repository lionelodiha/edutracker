import { Navigate, useParams } from "react-router-dom";

/** Faculties now live in Academic Structure (ACADEMIC-DESIGN §10). Old /faculties links land there. */
export default function FacultiesListPage() {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/dashboard/organizations/${id}/structure`} replace />;
}
