using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/favorites")]
public class FavoritesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<FavoriteItemResponse>>> GetMyFavorites([FromQuery] Guid buyerId, CancellationToken cancellationToken)
    {
        var userExists = await dbContext.Users.AnyAsync(x => x.Id == buyerId, cancellationToken);
        if (!userExists)
        {
            return NotFound("Пользователь не найден.");
        }

        var items = await dbContext.Favorites
            .AsNoTracking()
            .Include(x => x.Product)
            .ThenInclude(x => x.ProductImages)
            .Where(x => x.BuyerId == buyerId && x.Product.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(items.Select(ToResponse).ToList());
    }

    [HttpPost("items")]
    public async Task<ActionResult<IReadOnlyCollection<FavoriteItemResponse>>> AddItem([FromBody] AddFavoriteRequest request, CancellationToken cancellationToken)
    {
        var userExists = await dbContext.Users.AnyAsync(x => x.Id == request.BuyerId, cancellationToken);
        if (!userExists)
        {
            return NotFound("Пользователь не найден.");
        }

        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == request.ProductId && x.IsActive, cancellationToken);
        if (product is null)
        {
            return NotFound("Товар не найден.");
        }

        var exists = await dbContext.Favorites.AnyAsync(
            x => x.BuyerId == request.BuyerId && x.ProductId == request.ProductId,
            cancellationToken);

        if (!exists)
        {
            dbContext.Favorites.Add(new Favorite
            {
                BuyerId = request.BuyerId,
                ProductId = request.ProductId,
                CreatedAt = DateTime.UtcNow
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetMyFavorites(request.BuyerId, cancellationToken);
    }

    [HttpDelete("items/{productId:guid}")]
    public async Task<ActionResult<IReadOnlyCollection<FavoriteItemResponse>>> RemoveItem(Guid productId, [FromQuery] Guid buyerId, CancellationToken cancellationToken)
    {
        var item = await dbContext.Favorites
            .FirstOrDefaultAsync(x => x.BuyerId == buyerId && x.ProductId == productId, cancellationToken);

        if (item is not null)
        {
            dbContext.Favorites.Remove(item);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetMyFavorites(buyerId, cancellationToken);
    }

    private static FavoriteItemResponse ToResponse(Favorite item) =>
        new(
            item.ProductId,
            item.Product.Title,
            item.Product.Price,
            item.Product.Description,
            item.Product.ProductImages
                .OrderBy(x => x.CreatedAt)
                .Select(x => x.ImageUrl)
                .ToList());
}
