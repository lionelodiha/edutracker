using EduTracker.Models;

namespace EduTracker.Common.Responses;

public interface IOperationResponse
{
    public string Id { get; }
    public string Title { get; }
    public ResponseDetail[] Details { get; }
}
