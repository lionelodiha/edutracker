using EduTracker.Application.CQRS.Messaging;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Infrastructure.CQRS.Messaging;

internal class Mediator(IServiceProvider serviceProvider) : IMediator
{
    public Task<TResult> Send<TResult>(IRequest<TResult> message, CancellationToken cancellationToken = default)
    {
        Type handlerType = typeof(IHandler<,>).MakeGenericType(message.GetType(), typeof(TResult));

        dynamic handler = serviceProvider.GetRequiredService(handlerType);
        return handler.Handle((dynamic)message, cancellationToken);
    }
}
