using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/ratings")]
public class MyRatingsController(AppDbContext dbContext) : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyCollection<MyRatingResponse>>> GetMyRatings(CancellationToken cancellationToken)
    {
        var idClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(idClaim, out var userId))
        {
            return Unauthorized("Некорректный токен.");
        }

        var ratings = await dbContext.ProductRatings
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new MyRatingResponse(x.ProductId, x.Rating, x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(ratings);
    }
}

