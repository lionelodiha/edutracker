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
