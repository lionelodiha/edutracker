import ComingSoonPage from "../ComingSoonPage";

export default function TeacherDashboardPage() {
    return (
        <ComingSoonPage
            title="Teacher Portal"
            description="The teacher dashboard (classes, rosters, assignments, grades, attendance) is waiting on the class/roster/assignment/grade/attendance endpoints from the backend. See School_API_Requirements.md §4–§7."
            backTo="/portal-login"
            backLabel="← Back to Portal Sign In"
        />
    );
}
