using EduTracker.Data;
using EduTracker.DTOs;
using EduTracker.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduTracker.Interfaces.Services;
using EntityUser = EduTracker.Entities.User;

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

        var existingInvite = await _context.Invitations
            .FirstOrDefaultAsync(i => i.Email == dto.Email && i.OrganizationId == organizationId && i.Status == "pending");

        if (existingInvite != null)
        {
             _context.Invitations.Remove(existingInvite);
        }

        var invitation = new Invitation
        {
            Email = dto.Email,
            Role = dto.Role,
            OrganizationId = organizationId,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        var org = await _context.Organizations.FindAsync(organizationId);

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

    [HttpPost("accept")]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationDto dto, [FromQuery] Guid userId)
    {
        var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.Id == dto.Token);
        
        if (invitation == null || invitation.Status != "pending")
        {
            return BadRequest(new { message = "Invalid or expired invitation." });
        }

        if (invitation.ExpiresAt.HasValue && invitation.ExpiresAt.Value < DateTime.UtcNow)
        {
            invitation.Status = "expired";
            await _context.SaveChangesAsync();
            return BadRequest(new { message = "Invitation has expired." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
             return BadRequest(new { message = "User not found." });
        }

        if (!_context.UserOrganizations.Any(uo => uo.UserId == user.Id && uo.OrganizationId == invitation.OrganizationId))
        {
            var userOrg = new UserOrganization
            {
                UserId = user.Id,
                OrganizationId = invitation.OrganizationId,
                Role = invitation.Role
            };
            _context.UserOrganizations.Add(userOrg);
        }

        invitation.Status = "used";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Invitation accepted." });
    }
}
