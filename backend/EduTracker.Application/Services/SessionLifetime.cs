using EduTracker.Application.Configurations.Security;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Services;

public sealed class SessionLifetime
{
    public TimeSpan DefaultSession { get; }
    public TimeSpan RememberMeSession { get; }
    public TimeSpan GracePeriod { get; }

    public SessionLifetime(IOptions<SessionLifetimeOptions> options)
    {
        SessionLifetimeOptions opts = options.Value;

        if (opts.DefaultSessionHours <= 0)
            throw new InvalidOperationException("Session:DefaultSessionHours must be greater than 0.");

        if (opts.RememberMeSessionDays <= 0)
            throw new InvalidOperationException("Session:RememberMeSessionDays must be greater than 0.");

        if (opts.GracePeriodDays < 0)
            throw new InvalidOperationException("Session:GracePeriodDays cannot be negative.");

        DefaultSession = TimeSpan.FromHours(opts.DefaultSessionHours);
        RememberMeSession = TimeSpan.FromDays(opts.RememberMeSessionDays);
        GracePeriod = TimeSpan.FromDays(opts.GracePeriodDays);
    }

    public TimeSpan ResolveSession(bool rememberMe) => rememberMe ? RememberMeSession : DefaultSession;
    public TimeSpan ResolveEffectiveLifetime(bool rememberMe) => ResolveSession(rememberMe) + GracePeriod;
}
