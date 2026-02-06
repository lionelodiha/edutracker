using EduTracker.Api.Models;

namespace EduTracker.Api.Endpoints.Base.Handlers.GetInfo;

internal static class GetInfoEndpointHandler
{
    private static readonly string[] Features = [
        "User Authentication & Management",
        "Job Posting & Candidate Sourcing",
        "Job Matching & Recommendations",
        "Roadmap & Career Planning",
        "AI-Powered Insights",
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
                Name = "EduTracker API Gateway",
                Version = "1.0.0",
                Description = "The central API gateway powering job matching, recruitment workflows, and career development services.",
                Features,
                Documentation = "Available at /scalar (development environments only).",
            }
        );

        return Results.Ok(response);
    }
}
