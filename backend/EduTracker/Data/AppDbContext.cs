using Microsoft.EntityFrameworkCore;
using EduTracker.Configurations.Entities;
using EntityUser = EduTracker.Entities.User;
using EduTracker.Models;

namespace EduTracker.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<EntityUser> Users { get; set; }
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<Invitation> Invitations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfiguration());
    }
}