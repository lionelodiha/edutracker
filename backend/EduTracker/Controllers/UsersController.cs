using EduTracker.Data;
using EduTracker.DTOs;
using EduTracker.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
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
            .Where(u => u.Role != "admin") // Don't show main admin in list? Frontend logic says: filter(u => u.role !== 'admin')
            .ToListAsync();
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

        if (await _context.Users.AnyAsync(u => u.Email == signupDto.Email))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        var newUser = new User
        {
            Email = signupDto.Email,
            FirstName = signupDto.FirstName,
            LastName = signupDto.LastName,
            MiddleName = signupDto.MiddleName,
            Password = signupDto.Password,
            Role = signupDto.Role,
            Status = "active", // Admin created users are active by default
            AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(signupDto.FirstName + "+" + signupDto.LastName)}",
            OrganizationId = organizationId
        };

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

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (user.OrganizationId != organizationId)
        {
            return Forbid();
        }

        user.Status = updateDto.Status;
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

        var user = await _context.Users.FindAsync(id);
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
