namespace EduTracker.Application.CQRS.Messaging;

public interface IHandler<in TMessage, TResult>
{
    Task<TResult> Handle(TMessage message, CancellationToken cancellationToken = default);
}
