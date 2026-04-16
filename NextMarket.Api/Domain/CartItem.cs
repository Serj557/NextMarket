namespace NextMarket.Api.Domain;

public class CartItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuyerId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Buyer { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
