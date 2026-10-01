namespace EduTracker.Domain.Entities.Organizations;

public enum OrganizationMemberRole
{
    Member,
    Moderator,
    Owner,
    // NOTE: Added for temporary direct-provisioning flow (AddStaffMember feature).
    // These roles will remain after the long-term email-invite flow ships — they are
    // the canonical school roles referenced in School_API_Requirements.md.
    Admin,
    Teacher,
    Student,
}
