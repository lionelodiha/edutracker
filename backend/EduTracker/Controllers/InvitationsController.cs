using EduTracker.Data;
using EduTracker.DTOs;
using EduTracker.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduTracker.Interfaces.Services;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHashingService _hashingService;

    public InvitationsController(AppDbContext context, IHashingService hashingService)
    {
        _context = context;
        _hashingService = hashingService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvitation([FromBody] CreateInvitationDto dto, [FromQuery] string organizationId)
    {
        if (string.IsNullOrEmpty(organizationId))
        {
            return BadRequest(new { message = "Organization ID is required" });
        }

        // Check if user already exists
        string normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        // Check if active invitation already exists
        var existingInvite = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Email == dto.Email && i.OrganizationId == organizationId && i.Status == "pending");

        if (existingInvite != null)
        {
             // return existing invite or regenerate? Let's regenerate.
             _context.Invitations.Remove(existingInvite);
        }

        var invitation = new Invitation
        {
            Email = dto.Email,
            Role = dto.Role,
            OrganizationId = organizationId,
            ExpiresAt = DateTime.UtcNow.AddDays(7) // 7 days expiry
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        var org = await _context.Organizations.FindAsync(organizationId);

        // Generate link (assuming frontend is running on same host or configured url)
        // For local dev we assume localhost:5173 (Vite default) or whatever the origin is.
        // We'll return the token and let frontend construct the full link, or construct it here.
        // Better to return the token and a relative path.

        return Ok(new InvitationResponseDto(
            invitation.Id,
            invitation.Email,
            invitation.Role,
            invitation.OrganizationId,
            org?.Name ?? "Unknown Organization",
            $"/auth?token={invitation.Id}"
        ));
    }

    [HttpGet("{token}")]
    public async Task<IActionResult> GetInvitation(string token)
    {
        var invitation = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Id == token);

        if (invitation == null)
        {
            return NotFound(new { message = "Invitation not found" });
        }

        if (invitation.Status != "pending")
        {
            return BadRequest(new { message = "Invitation is no longer valid" });
        }

        if (invitation.ExpiresAt.HasValue && invitation.ExpiresAt.Value < DateTime.UtcNow)
        {
            invitation.Status = "expired";
            await _context.SaveChangesAsync();
            return BadRequest(new { message = "Invitation has expired" });
        }

        // Fetch Organization Name
        var org = await _context.Organizations.FindAsync(invitation.OrganizationId);

        return Ok(new InvitationResponseDto(
            invitation.Id,
            invitation.Email,
            invitation.Role,
            invitation.OrganizationId,
            org?.Name ?? "Unknown Organization",
            $"/auth?token={invitation.Id}"
        ));
    }
}
