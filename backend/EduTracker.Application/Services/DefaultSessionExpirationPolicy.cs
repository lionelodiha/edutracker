using EduTracker.Application.Configurations.Security;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Services;

public class SessionPolicy
{
    public TimeSpan StandardSessionDuration { get; }
    public TimeSpan ExtendedSessionDuration { get; }
    public TimeSpan AbsoluteSessionLimit { get; }

    public TimeSpan StandardExpiryExtension { get; }
    public TimeSpan ExtendedExpiryExtension { get; }

    public double ExpiryExtensionTriggerPercent { get; }

    public SessionPolicy(IOptions<SessionManagementOptions> optionsAccessor)
    {
        if (optionsAccessor == null) throw new ArgumentNullException(nameof(optionsAccessor));

        var options = optionsAccessor.Value ?? throw new ArgumentException("SessionManagementOptions cannot be null");

        // --- Validation ---
        if (options.StandardSessionDurationHours <= 0)
            throw new ArgumentException("StandardSessionDurationHours must be > 0");

        if (options.ExtendedSessionDurationDays <= 0)
            throw new ArgumentException("ExtendedSessionDurationDays must be > 0");

        if (options.AbsoluteSessionLimitDays < options.ExtendedSessionDurationDays)
            throw new ArgumentException("AbsoluteSessionLimitDays must be >= ExtendedSessionDurationDays");

        if (options.ExpiryExtensionTriggerPercent < 1 || options.ExpiryExtensionTriggerPercent > 100)
            throw new ArgumentException("ExpiryExtensionTriggerPercent must be between 1 and 100");

        // --- Conversion ---
        StandardSessionDuration = TimeSpan.FromHours(options.StandardSessionDurationHours);
        ExtendedSessionDuration = TimeSpan.FromDays(options.ExtendedSessionDurationDays);
        AbsoluteSessionLimit = TimeSpan.FromDays(options.AbsoluteSessionLimitDays);

        StandardExpiryExtension = TimeSpan.FromHours(options.StandardExpiryExtensionHours);
        ExtendedExpiryExtension = TimeSpan.FromHours(options.ExtendedExpiryExtensionHours);

        ExpiryExtensionTriggerPercent = options.ExpiryExtensionTriggerPercent;
    }

    public TimeSpan GetExpiryThreshold(TimeSpan sessionDuration)
    {
        return TimeSpan.FromSeconds(sessionDuration.TotalSeconds * ExpiryExtensionTriggerPercent / 100.0);
    }

    public TimeSpan GetExpiryExtension(TimeSpan sessionDuration)
    {
        return sessionDuration == StandardSessionDuration ? StandardExpiryExtension : ExtendedExpiryExtension;
    }

    // public static DateTime? GetNewExpiry(UserSession session, DateTime now)
    // {
    //     if (!session.IsActive)
    //         return null;

    //     var remaining = session.ExpiresAt - now;
    //     if (remaining <= TimeSpan.Zero)
    //         return null;

    //     var totalLifetime = session.AbsoluteExpiresAt - session.CreatedAt;
    //     var threshold = TimeSpan.FromTicks(
    //         (long)(totalLifetime.Ticks * ThresholdRatio));

    //     if (remaining > threshold)
    //         return null;

    //     var slide = session.RememberMe ? RememberSlide : NoRememberSlide;
    //     return now.Add(slide);
    // }
}

// public interface IJwtService
// {
//     string GenerateAccessToken(User user);
//     string GenerateRefreshToken();
//     ClaimsPrincipal? ValidateToken(string token, bool validateLifetime = true);
//     ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
// }

// public class JwtService : IJwtService
// {
//     private readonly JwtSettings _jwtSettings;
//     private readonly ILogger<JwtService> _logger;

//     public JwtService(IOptions<JwtSettings> jwtSettings, ILogger<JwtService> logger)
//     {
//         _jwtSettings = jwtSettings.Value;
//         _logger = logger;
//     }

//     public string GenerateAccessToken(User user)
//     {
//         var tokenHandler = new JwtSecurityTokenHandler();
//         var key = Encoding.ASCII.GetBytes(_jwtSettings.SecretKey);

//         var claims = new List<Claim>
//         {
//             new(ClaimTypes.NameIdentifier, user.Id.ToString()),
//             new(ClaimTypes.Name, user.Username),
//             new(ClaimTypes.Email, user.Email),
//             new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
//             new(JwtRegisteredClaimNames.Iat,
//                 new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
//                 ClaimValueTypes.Integer64)
//         };

//         // Add role claims
//         foreach (var role in user.Roles)
//         {
//             claims.Add(new Claim(ClaimTypes.Role, role));
//         }

//         var tokenDescriptor = new SecurityTokenDescriptor
//         {
//             Subject = new ClaimsIdentity(claims),
//             Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
//             Issuer = _jwtSettings.Issuer,
//             Audience = _jwtSettings.Audience,
//             SigningCredentials = new SigningCredentials(
//                 new SymmetricSecurityKey(key),
//                 SecurityAlgorithms.HmacSha256Signature)
//         };

//         var token = tokenHandler.CreateToken(tokenDescriptor);
//         var tokenString = tokenHandler.WriteToken(token);

//         _logger.LogInformation("Access token generated for user {Username}", user.Username);

//         return tokenString;
//     }

//     public string GenerateRefreshToken()
//     {
//         var randomNumber = new byte[64];
//         using var rng = RandomNumberGenerator.Create();
//         rng.GetBytes(randomNumber);
//         return Convert.ToBase64String(randomNumber);
//     }

//     public ClaimsPrincipal? ValidateToken(string token, bool validateLifetime = true)
//     {
//         var tokenHandler = new JwtSecurityTokenHandler();
//         var key = Encoding.ASCII.GetBytes(_jwtSettings.SecretKey);

//         try
//         {
//             var validationParameters = new TokenValidationParameters
//             {
//                 ValidateIssuerSigningKey = true,
//                 IssuerSigningKey = new SymmetricSecurityKey(key),
//                 ValidateIssuer = true,
//                 ValidIssuer = _jwtSettings.Issuer,
//                 ValidateAudience = true,
//                 ValidAudience = _jwtSettings.Audience,
//                 ValidateLifetime = validateLifetime,
//                 ClockSkew = TimeSpan.FromMinutes(1) // Allow 1 minute clock skew
//             };

//             var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

//             // Ensure the token uses the expected algorithm
//             if (validatedToken is JwtSecurityToken jwtToken &&
//                 !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
//             {
//                 _logger.LogWarning("Token validation failed: Invalid algorithm {Algorithm}", jwtToken.Header.Alg);
//                 return null;
//             }

//             return principal;
//         }
//         catch (SecurityTokenException ex)
//         {
//             _logger.LogWarning(ex, "Token validation failed");
//             return null;
//         }
//     }

//     public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
//     {
//         return ValidateToken(token, false);
//     }
// }