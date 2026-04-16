namespace NextMarket.Api.Contracts;

public record UserResponse(Guid Id, string Email, string Name, DateTime CreatedAt);

public record AuthResponse(string Token, Guid UserId, string Email, string Name);

public record ProductResponse(
    Guid Id,
    Guid SellerId,
    string SellerName,
    decimal? SellerRating,
    string Title,
    string? Description,
    decimal Price,
    int StockQty,
    bool IsActive,
    decimal? AverageRating,
    IReadOnlyCollection<string> ImageUrls,
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

public record CartItemResponse(
    Guid ProductId,
    string Title,
    decimal Price,
    string? Description,
    int Quantity,
    int StockQty,
    IReadOnlyCollection<string> ImageUrls);

public record FavoriteItemResponse(
    Guid ProductId,
    string Title,
    decimal Price,
    string? Description,
    IReadOnlyCollection<string> ImageUrls);
