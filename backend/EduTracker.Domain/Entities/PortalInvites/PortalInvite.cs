using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Users;
using System.Security.Cryptography;
using System.Text;

namespace EduTracker.Domain.Entities;

public sealed class PortalInvite : IEntity
{
    private PortalInvite() { }

    public PortalInvite(
        Guid organizationId, 
        string email, 
        OrganizationMemberRole role, 
        Guid invitedByUserId,
        byte[] tokenHash)
    {
        OrganizationId = organizationId;
        Email = email.ToLowerInvariant();
        EmailHash = ComputeEmailHash(Email);
        Role = role;
        InvitedByUserId = invitedByUserId;
        TokenHash = tokenHash;
        ExpiresAt = DateTime.UtcNow.AddDays(7);
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Email { get; private set; } = string.Empty;
    public byte[] EmailHash { get; private set; } = [];

    public OrganizationMemberRole Role { get; private set; }

    public byte[] TokenHash { get; private set; } = [];

    public Guid InvitedByUserId { get; private set; }
    public User InvitedByUser { get; private set; } = null!;

    public DateTime ExpiresAt { get; private set; }
    public DateTime? ConsumedAt { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public void MarkAsConsumed()
    {
        if (ConsumedAt != null)
            return;

        ConsumedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        MarkAsConsumed(); // Soft-delete by marking consumed early
    }

    public static byte[] ComputeTokenHash(string rawToken)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
    }

    public static byte[] ComputeEmailHash(string email)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(email.ToLowerInvariant()));
    }
}
