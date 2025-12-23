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

    public JwtService(IOptions<SessionTokenOptions> options)
    {
        var opts = options.Value ?? throw new InvalidOperationException("SessionTokenOptions must be provided.");

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

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opts.SecretKey));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public string GenerateToken(string userId, string userName)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.UniqueName, userName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiryMinutes),
            signingCredentials: _signingCredentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = _signingCredentials.Key;

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _issuer,
            ValidAudience = _audience,
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            var principal = tokenHandler.ValidateToken(token, parameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken || !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
                throw new SecurityTokenException("Invalid token algorithm");
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
