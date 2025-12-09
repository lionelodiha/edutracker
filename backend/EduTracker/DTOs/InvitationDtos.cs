namespace EduTracker.DTOs;

public record CreateInvitationDto(string Email, string Role);
public record InvitationResponseDto(string Token, string Email, string Role, string OrganizationId, string OrganizationName, string InviteLink);
