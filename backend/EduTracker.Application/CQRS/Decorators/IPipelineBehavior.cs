using EduTracker.Application.CQRS.Messaging;

namespace EduTracker.Application.CQRS.Decorators;

public interface IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, Func<Task<TResponse>> next, CancellationToken cancellationToken = default);
}
