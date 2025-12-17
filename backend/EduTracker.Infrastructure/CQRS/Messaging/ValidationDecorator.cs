// using EduTracker.Application.Exceptions;
// using Microsoft.Extensions.DependencyInjection;

// namespace EduTracker.Infrastructure.CQRS.Messaging;

// public class ValidationMediatorDecorator(IMediator inner, IServiceProvider sp) : IMediator
// {
//     private readonly IMediator _inner = inner;
//     private readonly IServiceProvider _serviceProvider = sp;

//     public async Task<TResult> Send<TMessage, TResult>(TMessage message, CancellationToken ct = default)
//     {
//         // Resolve validators automatically
//         var validators = _serviceProvider.GetServices<IValidator<TMessage>>();
//         foreach (var validator in validators)
//         {
//             var result = await validator.ValidateAsync(message, ct);
//             if (!result.IsValid)
//                 throw new ValidationException(result.Errors);
//         }

//         throw new AppException()

//         return await _inner.Send<TMessage, TResult>(message, ct);
//     }
// }

using EduTracker.Application.CQRS.Messaging;
using FluentValidation;

namespace EduTracker.Infrastructure.CQRS.Messaging;

public class ValidationBehavior<TRequest, TResponse> : IHandler<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IHandler<TRequest, TResponse> _next;
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IHandler<TRequest, TResponse> next, IEnumerable<IValidator<TRequest>> validators)
    {
        _next = next;
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, CancellationToken ct)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var results = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, ct)));
            var failures = results.SelectMany(r => r.Errors).Where(f => f != null).ToList();

            if (failures.Count > 0)
                throw new ValidationException(failures);
        }

        return await _next.Handle(request, ct);
    }
}
