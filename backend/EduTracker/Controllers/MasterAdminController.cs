using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduTracker.Data;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MasterAdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public MasterAdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("organizations")]
    public async Task<IActionResult> GetAllOrganizations()
    {
        var orgs = await _context.Organizations
            .Select(o => new
            {
                o.Id,
                o.Name,
                o.SubscriptionStatus,
                o.CreatedAt,
                UserCount = _context.Users.Count(u => u.OrganizationId == o.Id)
            })
            .ToListAsync();

        return Ok(orgs);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalOrgs = await _context.Organizations.CountAsync();
        var totalUsers = await _context.Users.CountAsync();
        var activeSubscriptions = await _context.Organizations.CountAsync(o => o.SubscriptionStatus == "active");

        return Ok(new
        {
            TotalOrganizations = totalOrgs,
            TotalUsers = totalUsers,
            ActiveSubscriptions = activeSubscriptions
        });
    }
}
