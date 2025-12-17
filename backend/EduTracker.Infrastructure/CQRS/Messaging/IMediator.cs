using EduTracker.Application.CQRS.Messaging;

namespace EduTracker.Infrastructure.CQRS.Messaging;

public interface IMediator
{
    Task<TResult> Send<TResult>(
        IRequest<TResult> message,
        CancellationToken cancellationToken = default);
}
