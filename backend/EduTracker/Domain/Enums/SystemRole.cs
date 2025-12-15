using System.ComponentModel.DataAnnotations;

namespace EduTracker.Domain.Enums;

public enum SystemRole
{

    [Display(Name = "User")]
    User,

    [Display(Name = "Admin")]
    Admin,

    [Display(Name = "Super Admin")]
    SuperAdmin,
}
