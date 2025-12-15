using EduTracker.Constants.Responses;
using EduTracker.Extensions.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

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

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireSessionAttribute(params string[] requiredRoles) : Attribute, IAuthorizationFilter
{
    private readonly string[] _requiredRoles = requiredRoles ?? [];

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Must have an authenticated identity set by SessionAuthMiddleware
        if (user?.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (_requiredRoles.Length > 0)
        {
            var hasAnyRole = _requiredRoles.Any(r => user.IsInRole(r));
            if (!hasAnyRole)
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}
