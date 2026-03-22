using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Academics.Handlers.CreateCourse;
using EduTracker.Api.Endpoints.Academics.Handlers.CreateCourseOffering;
using EduTracker.Api.Endpoints.Academics.Handlers.CreateSemester;
using EduTracker.Api.Endpoints.Academics.Handlers.DeleteCourse;
using EduTracker.Api.Endpoints.Academics.Handlers.DeleteCourseOffering;
using EduTracker.Api.Endpoints.Academics.Handlers.DeleteSemester;
using EduTracker.Api.Endpoints.Academics.Handlers.GetCourseById;
using EduTracker.Api.Endpoints.Academics.Handlers.GetCourseOfferingsBySemester;
using EduTracker.Api.Endpoints.Academics.Handlers.GetCourses;
using EduTracker.Api.Endpoints.Academics.Handlers.GetSemesterById;
using EduTracker.Api.Endpoints.Academics.Handlers.GetSemesters;
using EduTracker.Api.Endpoints.Academics.Handlers.UpdateCourse;
using EduTracker.Api.Endpoints.Academics.Handlers.UpdateSemester;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Academics.Models;

namespace EduTracker.Api.Endpoints.Academics;

internal static class AcademicEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapAcademicEndpoints()
        {
            RouteGroupBuilder courseGroup = app.MapGroup(ApiRoutes.Academic.Course.Base)
                .WithTags("Academics");

            courseGroup.MapPost(ApiRoutes.Academic.Course.List, CreateCourseEndpointHandler.Handle)
                .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .WithSummary("Create course")
                .WithDescription($"Requires a valid `{CookieKeys.Session}` session and organization manager access.")
                .RequireAuthorization();

            courseGroup.MapGet(ApiRoutes.Academic.Course.List, GetCoursesEndpointHandler.Handle)
                .Produces<ApiResponse<IReadOnlyList<CourseResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .WithSummary("List courses")
                .RequireAuthorization();

            courseGroup.MapGet(ApiRoutes.Academic.Course.GetById, GetCourseByIdEndpointHandler.Handle)
                .Produces<ApiResponse<CourseResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .WithSummary("Get course by id")
                .RequireAuthorization();

            courseGroup.MapPatch(ApiRoutes.Academic.Course.Update, UpdateCourseEndpointHandler.Handle)
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .WithSummary("Update course")
                .RequireAuthorization();

            courseGroup.MapDelete(ApiRoutes.Academic.Course.Delete, DeleteCourseEndpointHandler.Handle)
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .WithSummary("Delete course")
                .RequireAuthorization();

            RouteGroupBuilder semesterGroup = app.MapGroup(ApiRoutes.Academic.Semester.Base)
                .WithTags("Academics");

            semesterGroup.MapPost(ApiRoutes.Academic.Semester.List, CreateSemesterEndpointHandler.Handle)
                .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .WithSummary("Create semester")
                .RequireAuthorization();

            semesterGroup.MapGet(ApiRoutes.Academic.Semester.List, GetSemestersEndpointHandler.Handle)
                .Produces<ApiResponse<IReadOnlyList<SemesterResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .WithSummary("List semesters")
                .RequireAuthorization();

            semesterGroup.MapGet(ApiRoutes.Academic.Semester.GetById, GetSemesterByIdEndpointHandler.Handle)
                .Produces<ApiResponse<SemesterResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .WithSummary("Get semester by id")
                .RequireAuthorization();

            semesterGroup.MapPatch(ApiRoutes.Academic.Semester.Update, UpdateSemesterEndpointHandler.Handle)
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .WithSummary("Update semester")
                .RequireAuthorization();

            semesterGroup.MapDelete(ApiRoutes.Academic.Semester.Delete, DeleteSemesterEndpointHandler.Handle)
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .WithSummary("Delete semester")
                .RequireAuthorization();

            RouteGroupBuilder courseOfferingGroup = app.MapGroup(ApiRoutes.Academic.CourseOffering.Base)
                .WithTags("Academics");

            courseOfferingGroup.MapPost(ApiRoutes.Academic.CourseOffering.Create, CreateCourseOfferingEndpointHandler.Handle)
                .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .WithSummary("Create course offering")
                .RequireAuthorization();

            courseOfferingGroup.MapGet(ApiRoutes.Academic.CourseOffering.ListBySemester, GetCourseOfferingsBySemesterEndpointHandler.Handle)
                .Produces<ApiResponse<IReadOnlyList<CourseOfferingResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .WithSummary("List course offerings by semester")
                .RequireAuthorization();

            courseOfferingGroup.MapDelete(ApiRoutes.Academic.CourseOffering.Delete, DeleteCourseOfferingEndpointHandler.Handle)
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .WithSummary("Delete course offering")
                .RequireAuthorization();
        }
    }
}
