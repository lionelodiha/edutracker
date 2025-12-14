using EduTracker.Constants.Responses;
using EduTracker.Extensions.Responses;
using Microsoft.AspNetCore.Authorization;

public class RequireAuthFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var endpoint = context.HttpContext.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<AllowAnonymousAttribute>() != null)
        {
            // Skip auth
            return await next(context);
        }

        if (!context.HttpContext.Items.TryGetValue("User", out var user))
            throw ResponseCatalog.Auth.UnAuthorized.ToException();

        return await next(context);
    }
}
