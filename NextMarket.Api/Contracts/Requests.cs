using System.ComponentModel.DataAnnotations;

namespace NextMarket.Api.Contracts;

public record RegisterUserRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MaxLength(120)] string Name);

public record LoginUserRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(6)] string Password);

public record CreateProductRequest(
    [Required] Guid SellerId,
    [Required, MaxLength(200)] string Title,
    string? Description,
    [Range(0.01, 9999999999)] decimal Price,
    [Range(0, int.MaxValue)] int StockQty);

public record UpdateProductRequest(
    [Required] Guid SellerId,
    [Required, MaxLength(200)] string Title,
    string? Description,
    [Range(0.01, 9999999999)] decimal Price,
    [Range(0, int.MaxValue)] int StockQty,
    bool IsActive);

public record CreateOrderRequest(
    [Required] Guid BuyerId,
    [Required, MinLength(1)] IReadOnlyCollection<CreateOrderItemRequest> Items);

public record CreateOrderItemRequest(
    [Required] Guid ProductId,
    [Range(1, int.MaxValue)] int Quantity);

public record SetOrderCompletedRequest([Required] Guid BuyerId);

public record RateProductRequest(
    [Required] Guid UserId,
    [Range(1, 5)] int Rating);
