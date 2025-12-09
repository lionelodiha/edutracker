using EduTracker.Data;
using EduTracker.DTOs;
using EduTracker.Interfaces.Services;
using EduTracker.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EntityUser = EduTracker.Entities.User;
using EduTracker.Endpoints.Users; // For UserFactory

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHashingService _hashingService;
    private readonly IDataEncryptionService _dataEncryptionService;

    public UsersController(AppDbContext context, IHashingService hashingService, IDataEncryptionService dataEncryptionService)
    {
        _context = context;
        _hashingService = hashingService;
        _dataEncryptionService = dataEncryptionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers([FromQuery] string organizationId)
    {
        if (string.IsNullOrEmpty(organizationId))
        {
            return BadRequest(new { message = "Organization ID is required" });
        }

        var users = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .Where(u => u.Role != "admin")
            .ToListAsync();
            
        // Note: For now, we are returning EntityUser directly, but we should probably map it to a DTO and decrypt sensitive data.
        // However, EntityUser properties like EmailHash are not useful for frontend.
        // We'll leave it as is for now to fix build, but this needs refactoring to decrypt data if needed.
        return Ok(users);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingUsers([FromQuery] string organizationId)
    {
        if (string.IsNullOrEmpty(organizationId))
        {
            return BadRequest(new { message = "Organization ID is required" });
        }

        var users = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .Where(u => u.Status == "pending")
            .ToListAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] SignupDto signupDto, [FromQuery] string organizationId)
    {
        if (string.IsNullOrEmpty(organizationId))
        {
            return BadRequest(new { message = "Organization ID is required" });
        }

        // Check if user exists by email hash
        string normalizedEmail = signupDto.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        string passwordHash = _hashingService.HashPassword(signupDto.Password);
        
        // Use a temporary request object to reuse UserFactory
        var registerRequest = new EduTracker.Endpoints.Users.RegisterUser.RegisterUserRequest(
            signupDto.Email,
            signupDto.FirstName, // Assuming first name
            signupDto.LastName, // Assuming last name
            signupDto.MiddleName ?? "",
            signupDto.FirstName.ToLower() + "." + signupDto.LastName.ToLower(), // Generate a username
            signupDto.Password
        );

        EntityUser newUser = UserFactory.Create(
            registerRequest,
            normalizedEmail,
            emailHash,
            passwordHash,
            _dataEncryptionService
        );

        newUser.SetRole(signupDto.Role);
        newUser.SetStatus("active");
        newUser.SetOrganizationId(organizationId);
        newUser.SetAvatarUrl($"https://ui-avatars.com/api/?name={Uri.EscapeDataString(signupDto.FirstName + "+" + signupDto.LastName)}");

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(newUser);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UserStatusUpdateDto updateDto, [FromQuery] string organizationId)
    {
        if (string.IsNullOrEmpty(organizationId))
        {
            return BadRequest(new { message = "Organization ID is required" });
        }

        if (!Guid.TryParse(id, out Guid userId))
        {
             return BadRequest(new { message = "Invalid User ID format" });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (user.OrganizationId != organizationId)
        {
            return Forbid();
        }

        user.SetStatus(updateDto.Status);
        await _context.SaveChangesAsync();

        return Ok(user);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id, [FromQuery] string organizationId)
    {
        if (string.IsNullOrEmpty(organizationId))
        {
            return BadRequest(new { message = "Organization ID is required" });
        }

        if (!Guid.TryParse(id, out Guid userId))
        {
             return BadRequest(new { message = "Invalid User ID format" });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (user.OrganizationId != organizationId)
        {
            return Forbid();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully" });
    }
}
