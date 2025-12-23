namespace EduTracker.Application.Features.Auth.Refresh;

public record class RefreshUserCommand
{

}

// public record LoginUserCommand(
//     string Identifier,
//     string Password,
//     bool RememberMe
// ) : IRequest<OperationResult<SessionData>>;

// public class LoginUserCommandHandler(AppDbContext db, IHashingService hashingService, SessionManagementService sessionManagementService)
//     : IHandler<LoginUserCommand, OperationResult<SessionData>>
// {
// }

// public class LoginUserCommandValidatior : AbstractValidator<LoginUserCommand>
// {
//     public LoginUserCommandValidatior()
//     { }
// }