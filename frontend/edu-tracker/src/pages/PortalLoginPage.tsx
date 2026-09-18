import ComingSoonPage from "./ComingSoonPage";

export default function PortalLoginPage() {
    return (
        <ComingSoonPage
            title="School Portal Sign In"
            description="Teachers and students will sign in here using their school code + email + password once the backend ships POST /api/auth/portal-login. See School_API_Requirements.md §3."
            backTo="/"
        />
    );
}
