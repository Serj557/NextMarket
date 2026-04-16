using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/cart")]
public class CartController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<CartItemResponse>>> GetMyCart([FromQuery] Guid buyerId, CancellationToken cancellationToken)
    {
        var userExists = await dbContext.Users.AnyAsync(x => x.Id == buyerId, cancellationToken);
        if (!userExists)
        {
            return NotFound("Пользователь не найден.");
        }

        var items = await dbContext.CartItems
            .AsNoTracking()
            .Include(x => x.Product)
            .ThenInclude(x => x.ProductImages)
            .Where(x => x.BuyerId == buyerId && x.Product.IsActive)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync(cancellationToken);

        return Ok(items.Select(ToResponse).ToList());
    }

    [HttpPost("items")]
    public async Task<ActionResult<IReadOnlyCollection<CartItemResponse>>> AddItem([FromBody] AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var buyerExists = await dbContext.Users.AnyAsync(x => x.Id == request.BuyerId, cancellationToken);
        if (!buyerExists)
        {
            return NotFound("Пользователь не найден.");
        }

        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == request.ProductId && x.IsActive, cancellationToken);
        if (product is null)
        {
            return NotFound("Товар не найден.");
        }

        if (product.SellerId == request.BuyerId)
        {
            return BadRequest("Нельзя добавлять в корзину собственный товар.");
        }

        var existing = await dbContext.CartItems
            .FirstOrDefaultAsync(x => x.BuyerId == request.BuyerId && x.ProductId == request.ProductId, cancellationToken);

        if (existing is null)
        {
            if (request.Quantity > product.StockQty)
            {
                return BadRequest($"Недостаточно товара на складе. Доступно: {product.StockQty}.");
            }

            dbContext.CartItems.Add(new CartItem
            {
                BuyerId = request.BuyerId,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var nextQty = existing.Quantity + request.Quantity;
            if (nextQty > product.StockQty)
            {
                return BadRequest($"Нельзя добавить больше, чем есть на складе. Доступно: {product.StockQty}.");
            }

            existing.Quantity += request.Quantity;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetMyCart(request.BuyerId, cancellationToken);
    }

    [HttpPatch("items/{productId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<CartItemResponse>>> UpdateItemQuantity(
        Guid productId,
        [FromBody] UpdateCartItemQuantityRequest request,
        CancellationToken cancellationToken)
    {
        var item = await dbContext.CartItems
            .Include(x => x.Product)
            .FirstOrDefaultAsync(x => x.BuyerId == request.BuyerId && x.ProductId == productId, cancellationToken);

        if (item is null)
        {
            return NotFound("Товар в корзине не найден.");
        }

        if (!item.Product.IsActive)
        {
            return BadRequest("Товар недоступен.");
        }

        if (request.Quantity > item.Product.StockQty)
        {
            return BadRequest($"Недостаточно товара на складе. Доступно: {item.Product.StockQty}.");
        }

        item.Quantity = request.Quantity;
        item.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetMyCart(request.BuyerId, cancellationToken);
    }

    [HttpPut("items/{productId:guid}")]
    public Task<ActionResult<IReadOnlyCollection<CartItemResponse>>> UpdateItemQuantityPut(
        Guid productId,
        [FromBody] UpdateCartItemQuantityRequest request,
        CancellationToken cancellationToken) =>
        UpdateItemQuantity(productId, request, cancellationToken);

    [HttpDelete("items/{productId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<CartItemResponse>>> RemoveItem(Guid productId, [FromQuery] Guid buyerId, CancellationToken cancellationToken)
    {
        var item = await dbContext.CartItems
            .FirstOrDefaultAsync(x => x.BuyerId == buyerId && x.ProductId == productId, cancellationToken);

        if (item is null)
        {
            return await GetMyCart(buyerId, cancellationToken);
        }

        dbContext.CartItems.Remove(item);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetMyCart(buyerId, cancellationToken);
    }

    private static CartItemResponse ToResponse(CartItem item) =>
        new(
            item.ProductId,
            item.Product.Title,
            item.Product.Price,
            item.Product.Description,
            item.Quantity,
            item.Product.StockQty,
            item.Product.ProductImages
                .OrderBy(x => x.CreatedAt)
                .Select(x => x.ImageUrl)
                .ToList());
}
