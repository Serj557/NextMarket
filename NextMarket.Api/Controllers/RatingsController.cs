using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Rate(Guid productId, [FromBody] RateProductRequest request, CancellationToken cancellationToken)
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idClaim, out var userId))
        {
            return Unauthorized("Некорректный токен.");
        }

        var productExists = await dbContext.Products.AnyAsync(x => x.Id == productId && x.IsActive, cancellationToken);
        if (!productExists)
        {
            return NotFound("Товар не найден.");
        }

        var currentRating = await dbContext.ProductRatings
            .FirstOrDefaultAsync(x => x.ProductId == productId && x.UserId == userId, cancellationToken);

        if (currentRating is null)
        {
            dbContext.ProductRatings.Add(new ProductRating
            {
                ProductId = productId,
                UserId = userId,
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
