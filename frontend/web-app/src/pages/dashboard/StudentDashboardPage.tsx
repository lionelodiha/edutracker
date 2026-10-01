import ComingSoonPage from "../ComingSoonPage";

export default function StudentDashboardPage() {
    return (
        <ComingSoonPage
            title="Student Portal"
            description="The student dashboard (enrolled classes, assignments, grades, attendance) is waiting on the class/roster/assignment/grade/attendance endpoints from the backend. See School_API_Requirements.md §4–§7."
            backTo="/portal-login"
            backLabel="← Back to Portal Sign In"
        />
    );
}
