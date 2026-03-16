using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Organizations;

internal sealed class OrganizationInviteOptionsValidator : IValidateOptions<OrganizationInviteOptions>
{
    public ValidateOptionsResult Validate(string? name, OrganizationInviteOptions options)
    {
        if (options.ExpiryDays <= 0)
            return ValidateOptionsResult.Fail("OrganizationInviteOptions:ExpiryDays must be greater than 0.");

        return ValidateOptionsResult.Success;
    }
}
