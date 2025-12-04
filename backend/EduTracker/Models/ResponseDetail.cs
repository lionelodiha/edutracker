using EduTracker.Enums;

namespace EduTracker.Models;

public record ResponseDetail(
    string Message,
    ResponseSeverity Severity
);
