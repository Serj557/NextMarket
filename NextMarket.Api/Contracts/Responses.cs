namespace NextMarket.Api.Contracts;

public record UserResponse(Guid Id, string Email, string Name, DateTime CreatedAt);

public record ProductResponse(
    Guid Id,
    Guid SellerId,
    string Title,
    string? Description,
    decimal Price,
    int StockQty,
    bool IsActive,
    decimal? AverageRating,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record OrderItemResponse(Guid ProductId, int Quantity, decimal UnitPrice);

public record OrderResponse(
    Guid Id,
    Guid BuyerId,
    string Status,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    IReadOnlyCollection<OrderItemResponse> Items);
