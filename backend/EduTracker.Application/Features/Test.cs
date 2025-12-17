using EduTracker.Application.CQRS.Messaging;

namespace EduTracker.Application.Features.Test;

// Simple command that requests a message
public record HelloWorldCommand : IRequest<string>;

// Implements IHandler from Infrastructure
public class HelloWorldCommandHandler : IHandler<HelloWorldCommand, string>
{
    public Task<string> Handle(HelloWorldCommand command, CancellationToken ct)
    {
        return Task.FromResult("Hello, EduTracker CQRS world!");
    }
}

public static class FakeStore
{
    public static readonly List<string> Items = new();
}

public record AddItemCommand(string Value) : IRequest<Unit>;

public record RemoveItemCommand(string Value) : IRequest<Unit>;

public class AddItemCommandHandler
    : IHandler<AddItemCommand, Unit>
{
    public Task<Unit> Handle(AddItemCommand command, CancellationToken ct)
    {
        FakeStore.Items.Add(command.Value);
        return Task.FromResult(Unit.Value);
    }
}

public class RemoveItemCommandHandler
    : IHandler<RemoveItemCommand, Unit>
{
    public Task<Unit> Handle(RemoveItemCommand command, CancellationToken ct)
    {
        FakeStore.Items.Remove(command.Value);
        return Task.FromResult(Unit.Value);
    }
}

public record GetItemsQuery : IRequest<IReadOnlyList<string>>;

public class GetItemsQueryHandler
    : IHandler<GetItemsQuery, IReadOnlyList<string>>
{
    public Task<IReadOnlyList<string>> Handle(GetItemsQuery query, CancellationToken ct)
    {
        return Task.FromResult((IReadOnlyList<string>)FakeStore.Items);
    }
}



public readonly struct Unit
{
    public static readonly Unit Value = new();
}
