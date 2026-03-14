using EduTracker.Api.Models;

namespace EduTracker.Api.Endpoints.Base.Handlers.GetInfo;

internal static class GetInfoEndpointHandler
{
    private static readonly string[] Features = [
        "Student & Educator Account Management",
        "Course & Curriculum Tracking",
        "Learning Progress & Performance Monitoring",
        "Academic Roadmaps & Learning Paths",
        "AI-Powered Academic Insights & Recommendations",
    ];

    public static IResult Handle()
    {
        ApiResponse<object> response = new(
            Success: true,
            MessageId: "INFO_API_RETRIEVED",
            Message: "API information retrieved successfully.",
            Details: null,
            Data: new
            {
                Name = "EduTracker API",
                Version = "1.0.0",
                Description = "A centralized API platform for managing educational data, tracking student learning progress, and delivering academic insights for institutions, educators, and learners.",
                Features,
                Documentation = "Available at /scalar (development environments only).",
            }
        );

        return Results.Ok(response);
    }
}
