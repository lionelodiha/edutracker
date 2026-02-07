using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Courses.Handlers.CreateCourse;
using EduTracker.Api.Endpoints.Courses.Handlers.CreateClass;
using EduTracker.Api.Models;
using Scalar.AspNetCore;

namespace EduTracker.Api.Endpoints.Courses;

internal static class CourseEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapCourseEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Course.Base)
                .WithTags("Courses");

            group.MapPost(ApiRoutes.Course.Create, CreateCourseEndpointHandler.Handle)
                .WithName(nameof(CreateCourseEndpointHandler))
                .WithSummary("Create course")
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .RequireAuthorization();

            group.MapPost(ApiRoutes.Course.CreateClass, CreateClassEndpointHandler.Handle)
                .WithName(nameof(CreateClassEndpointHandler))
                .WithSummary("Create class")
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .RequireAuthorization();
        }
    }
}
