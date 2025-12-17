using EduTracker.Application.CQRS.Messaging;

namespace EduTracker.Application.Features.Test
{
    // Simple command that requests a message
    public record HelloWorldCommand();
}

namespace EduTracker.Application.Features.Test
{
    // Implements IHandler from Infrastructure
    public class HelloWorldCommandHandler : IHandler<HelloWorldCommand, string>
    {
        public Task<string> Handle(HelloWorldCommand command, CancellationToken ct)
        {
            return Task.FromResult("Hello, EduTracker CQRS world!");
        }
    }
}