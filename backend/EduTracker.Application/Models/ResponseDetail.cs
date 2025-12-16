using EduTracker.Application.Enums;

namespace EduTracker.Application.Models;

public record ResponseDetail(
    string Message,
    ResponseSeverity Severity
);
