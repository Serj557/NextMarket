using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/ratings")]
public class RatingsController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Rate(Guid productId, [FromBody] RateProductRequest request, CancellationToken cancellationToken)
    {
        var productExists = await dbContext.Products.AnyAsync(x => x.Id == productId && x.IsActive, cancellationToken);
        if (!productExists)
        {
            return NotFound("Товар не найден.");
        }

        var userExists = await dbContext.Users.AnyAsync(x => x.Id == request.UserId, cancellationToken);
        if (!userExists)
        {
            return BadRequest("Пользователь не найден.");
        }

        var currentRating = await dbContext.ProductRatings
            .FirstOrDefaultAsync(x => x.ProductId == productId && x.UserId == request.UserId, cancellationToken);

        if (currentRating is null)
        {
            dbContext.ProductRatings.Add(new ProductRating
            {
                ProductId = productId,
                UserId = request.UserId,
                Rating = request.Rating
            });
        }
        else
        {
            currentRating.Rating = request.Rating;
            currentRating.CreatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
