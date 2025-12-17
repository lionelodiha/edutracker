using EduTracker.Application.CQRS.Messaging;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Infrastructure.CQRS.Messaging;

public class Mediator(IServiceProvider serviceProvider) : IMediator
{
    public Task<TResult> Send<TMessage, TResult>(TMessage message, CancellationToken cancellationToken = default)
    {
        var handler = serviceProvider.GetRequiredService<IHandler<TMessage, TResult>>();
        return handler.Handle(message, cancellationToken);
    }
}
