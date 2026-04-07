using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var sellerExists = await dbContext.Users.AnyAsync(x => x.Id == request.SellerId, cancellationToken);
        if (!sellerExists)
        {
            return BadRequest("Продавец не найден.");
        }

        var product = new Product
        {
            SellerId = request.SellerId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Price = request.Price,
            StockQty = request.StockQty,
            IsActive = true
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, await BuildProductResponse(product, cancellationToken));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> Update(Guid id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound("Товар не найден.");
        }

        if (product.SellerId != request.SellerId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Нельзя редактировать чужой товар.");
        }

        product.Title = request.Title.Trim();
        product.Description = request.Description?.Trim();
        product.Price = request.Price;
        product.StockQty = request.StockQty;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(await BuildProductResponse(product, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> SoftDelete(Guid id, [FromQuery] Guid sellerId, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound("Товар не найден.");
        }

        if (product.SellerId != sellerId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Нельзя удалять чужой товар.");
        }

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<ProductResponse>>> GetAll(
        [FromQuery] decimal? minRating,
        [FromQuery] bool onlyActive = true,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Products.AsNoTracking();
        if (onlyActive)
        {
            query = query.Where(x => x.IsActive);
        }

        var products = await query
            .Select(x => new
            {
                Product = x,
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average()
            })
            .Where(x => !minRating.HasValue || (x.AverageRating ?? 0) >= minRating.Value)
            .OrderByDescending(x => x.Product.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(products.Select(x => ToResponse(x.Product, x.AverageRating)).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var item = await dbContext.Products
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                Product = x,
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (item is null)
        {
            return NotFound("Товар не найден.");
        }

        return Ok(ToResponse(item.Product, item.AverageRating));
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyCollection<ProductResponse>>> GetMyProducts([FromQuery] Guid sellerId, CancellationToken cancellationToken)
    {
        var products = await dbContext.Products
            .AsNoTracking()
            .Where(x => x.SellerId == sellerId)
            .Select(x => new
            {
                Product = x,
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average()
            })
            .OrderByDescending(x => x.Product.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(products.Select(x => ToResponse(x.Product, x.AverageRating)).ToList());
    }

    private async Task<ProductResponse> BuildProductResponse(Product product, CancellationToken cancellationToken)
    {
        var avgRating = await dbContext.ProductRatings
            .Where(x => x.ProductId == product.Id)
            .Select(x => (decimal?)x.Rating)
            .AverageAsync(cancellationToken);

        return ToResponse(product, avgRating);
    }

    private static ProductResponse ToResponse(Product product, decimal? averageRating) =>
        new(
            product.Id,
            product.SellerId,
            product.Title,
            product.Description,
            product.Price,
            product.StockQty,
            product.IsActive,
            averageRating,
            product.CreatedAt,
            product.UpdatedAt);
}
