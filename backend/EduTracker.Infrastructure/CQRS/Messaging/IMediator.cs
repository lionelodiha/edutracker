namespace EduTracker.Infrastructure.CQRS.Messaging;

public interface IMediator
{
    Task<TResult> Send<TMessage, TResult>(TMessage message, CancellationToken cancellationToken = default);
}
