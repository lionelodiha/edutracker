using EduTracker.Application.Enums;

namespace EduTracker.Application.Models;

public sealed record ResponseDetail(
    string Message,
    ResponseSeverity Severity
);
