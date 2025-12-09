using System.ComponentModel.DataAnnotations;

namespace EduTracker.Enums;

public enum SchoolRole
{
    [Display(Name = "Student")]
    Student,

    [Display(Name = "Teacher")]
    Teacher,

    [Display(Name = "Moderator")]
    Moderator,

    [Display(Name = "Owner")]
    Owner,
}
