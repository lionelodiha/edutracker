using EduTracker.Application.CQRS.Messaging;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Infrastructure.CQRS.Messaging;

// public class Mediator(IServiceProvider serviceProvider) : IMediator
// {
//     public Task<TResult> Send<TMessage, TResult>(TMessage message, CancellationToken cancellationToken = default)
//     {
//         var handler = serviceProvider.GetRequiredService<IHandler<TMessage, TResult>>();
//         return handler.Handle(message, cancellationToken);
//     }
// }

public class Mediator(IServiceProvider serviceProvider) : IMediator
{
    public Task<TResult> Send<TResult>(
        IRequest<TResult> message,
        CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IHandler<,>)
            .MakeGenericType(message.GetType(), typeof(TResult));

        dynamic handler = serviceProvider.GetRequiredService(handlerType);
        return handler.Handle((dynamic)message, cancellationToken);
    }
}
