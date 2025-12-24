using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EduTracker.Application.Configurations.Security;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EduTracker.Application.Services;

public class JwtService
{
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    private readonly SigningCredentials _signingCredentials;
    private readonly JwtSecurityTokenHandler _jwtSecurityTokenHandler = new();
    private readonly TokenValidationParameters _tokenValidationParameters;

    public JwtService(IOptions<SessionTokenOptions> options)
    {
        SessionTokenOptions opts = options.Value;

        if (string.IsNullOrWhiteSpace(opts.SecretKey))
            throw new InvalidOperationException("SessionToken:SecretKey must be provided.");

        if (string.IsNullOrWhiteSpace(opts.Issuer))
            throw new InvalidOperationException("SessionToken:Issuer must be provided.");

        if (string.IsNullOrWhiteSpace(opts.Audience))
            throw new InvalidOperationException("SessionToken:Audience must be provided.");

        if (opts.AccessTokenExpirationMinutes <= 0)
            throw new InvalidOperationException("SessionToken:AccessTokenExpirationMinutes must be greater than 0.");

        _issuer = opts.Issuer;
        _audience = opts.Audience;
        _expiryMinutes = opts.AccessTokenExpirationMinutes;

        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(opts.SecretKey));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        _tokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _issuer,
            ValidAudience = _audience,
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero,
        };
    }

    public string GenerateToken(Claim[] claims)
    {
        JwtSecurityToken token = new(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiryMinutes),
            signingCredentials: _signingCredentials
        );

        return _jwtSecurityTokenHandler.WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            ClaimsPrincipal principal = _jwtSecurityTokenHandler.ValidateToken(
                token, _tokenValidationParameters, out SecurityToken validatedToken
            );

            if (!IsValidJwtAlgorithm(validatedToken)) return null;

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private static bool IsValidJwtAlgorithm(SecurityToken token)
    {
        return token is JwtSecurityToken jwtToken
            && jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase);
    }
}
