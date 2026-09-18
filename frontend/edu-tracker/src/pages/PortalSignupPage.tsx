import ComingSoonPage from "./ComingSoonPage";

export default function PortalSignupPage() {
    return (
        <ComingSoonPage
            title="Complete Your School Registration"
            description="New teachers and students will finish signing up here after clicking the invitation link in their email, once the backend ships POST /api/auth/portal-signup. See School_API_Requirements.md §2."
            backTo="/"
        />
    );
}
