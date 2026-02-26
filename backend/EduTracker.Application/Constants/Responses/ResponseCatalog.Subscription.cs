using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Subscription
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "SUB_CREATED",
            Title: "Subscription created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "SUB_RETRIEVED",
            Title: "Subscription retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "SUB_UPDATED",
            Title: "Subscription updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Canceled = new(
            Id: "SUB_CANCELED",
            Title: "Subscription canceled successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "SUB_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Subscription not found.",
            Details: []
        );

        public static readonly OperationFailureResponse ActiveExists = new(
            Id: "SUB_ACTIVE_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "An active subscription already exists for this organization.",
            Details: []
        );

        public static readonly OperationFailureResponse PaymentMethodRequired = new(
            Id: "SUB_PAYMENT_METHOD_REQUIRED",
            StatusCode: 400,
            Title: "A default payment method is required to manage subscriptions.",
            Details: []
        );

        public static readonly OperationFailureResponse PaymentFailed = new(
            Id: "SUB_PAYMENT_FAILED",
            StatusCode: 400,
            Title: "Subscription payment operation failed.",
            Details: []
        );
    }
}
