using EduTracker.Application.Common.Responses;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Assignment
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "ASSIGNMENT_CREATED",
            Title: "Assignment created successfully.",
            Details: []
        );
    }
}
