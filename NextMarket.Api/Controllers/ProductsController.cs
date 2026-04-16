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
        ApplyImageUrls(product, request.ImageUrls);
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
        var existingImages = await dbContext.ProductImages
            .Where(x => x.ProductId == product.Id)
            .ToListAsync(cancellationToken);
        dbContext.ProductImages.RemoveRange(existingImages);
        ApplyImageUrls(product, request.ImageUrls);

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(await BuildProductResponse(product, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid sellerId, CancellationToken cancellationToken)
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

        var hasOrders = await dbContext.OrderItems.AnyAsync(x => x.ProductId == id, cancellationToken);
        if (hasOrders)
        {
            return BadRequest("Нельзя удалить объявление, по которому уже есть заказы.");
        }

        dbContext.Products.Remove(product);
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
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average(),
                SellerName = x.Seller.Name,
                SellerRating = x.Seller.Products
                    .SelectMany(p => p.Ratings)
                    .Select(r => (decimal?)r.Rating)
                    .Average(),
                ImageUrls = x.ProductImages
                    .OrderBy(i => i.CreatedAt)
                    .Select(i => i.ImageUrl)
                    .ToList()
            })
            .Where(x => !minRating.HasValue || (x.AverageRating ?? 0) >= minRating.Value)
            .OrderByDescending(x => x.Product.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(products.Select(x => ToResponse(x.Product, x.AverageRating, x.SellerName, x.SellerRating, x.ImageUrls)).ToList());
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
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average(),
                SellerName = x.Seller.Name,
                SellerRating = x.Seller.Products
                    .SelectMany(p => p.Ratings)
                    .Select(r => (decimal?)r.Rating)
                    .Average(),
                ImageUrls = x.ProductImages
                    .OrderBy(i => i.CreatedAt)
                    .Select(i => i.ImageUrl)
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (item is null)
        {
            return NotFound("Товар не найден.");
        }

        return Ok(ToResponse(item.Product, item.AverageRating, item.SellerName, item.SellerRating, item.ImageUrls));
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyCollection<ProductResponse>>> GetMyProducts([FromQuery] Guid sellerId, CancellationToken cancellationToken)
    {
        var sellerExists = await dbContext.Users.AnyAsync(x => x.Id == sellerId, cancellationToken);
        if (!sellerExists)
        {
            return NotFound("Пользователь не найден.");
        }

        var products = await dbContext.Products
            .AsNoTracking()
            .Where(x => x.SellerId == sellerId && x.IsActive)
            .Select(x => new
            {
                Product = x,
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average(),
                SellerName = x.Seller.Name,
                SellerRating = x.Seller.Products
                    .SelectMany(p => p.Ratings)
                    .Select(r => (decimal?)r.Rating)
                    .Average(),
                ImageUrls = x.ProductImages
                    .OrderBy(i => i.CreatedAt)
                    .Select(i => i.ImageUrl)
                    .ToList()
            })
            .OrderByDescending(x => x.Product.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(products.Select(x => ToResponse(x.Product, x.AverageRating, x.SellerName, x.SellerRating, x.ImageUrls)).ToList());
    }

    [HttpGet("my/{id:guid}")]
    public async Task<ActionResult<ProductResponse>> GetMyProductById(Guid id, [FromQuery] Guid sellerId, CancellationToken cancellationToken)
    {
        var item = await dbContext.Products
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                Product = x,
                AverageRating = x.Ratings.Select(r => (decimal?)r.Rating).Average(),
                SellerName = x.Seller.Name,
                SellerRating = x.Seller.Products
                    .SelectMany(p => p.Ratings)
                    .Select(r => (decimal?)r.Rating)
                    .Average(),
                ImageUrls = x.ProductImages
                    .OrderBy(i => i.CreatedAt)
                    .Select(i => i.ImageUrl)
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (item is null)
        {
            return NotFound("Товар не найден.");
        }

        if (item.Product.SellerId != sellerId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Нельзя просматривать детали чужого товара.");
        }

        return Ok(ToResponse(item.Product, item.AverageRating, item.SellerName, item.SellerRating, item.ImageUrls));
    }

    private async Task<ProductResponse> BuildProductResponse(Product product, CancellationToken cancellationToken)
    {
        var avgRating = await dbContext.ProductRatings
            .Where(x => x.ProductId == product.Id)
            .Select(x => (decimal?)x.Rating)
            .AverageAsync(cancellationToken);

        var sellerInfo = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == product.SellerId)
            .Select(x => new
            {
                x.Name,
                SellerRating = x.Products
                    .SelectMany(p => p.Ratings)
                    .Select(r => (decimal?)r.Rating)
                    .Average()
            })
            .FirstAsync(cancellationToken);

        var imageUrls = await dbContext.ProductImages
            .AsNoTracking()
            .Where(x => x.ProductId == product.Id)
            .OrderBy(x => x.CreatedAt)
            .Select(x => x.ImageUrl)
            .ToListAsync(cancellationToken);

        return ToResponse(product, avgRating, sellerInfo.Name, sellerInfo.SellerRating, imageUrls);
    }

    private static ProductResponse ToResponse(
        Product product,
        decimal? averageRating,
        string sellerName,
        decimal? sellerRating,
        IReadOnlyCollection<string> imageUrls) =>
        new(
            product.Id,
            product.SellerId,
            sellerName,
            sellerRating,
            product.Title,
            product.Description,
            product.Price,
            product.StockQty,
            product.IsActive,
            averageRating,
            imageUrls,
            product.CreatedAt,
            product.UpdatedAt);

    private static void ApplyImageUrls(Product product, IReadOnlyCollection<string>? imageUrls)
    {
        product.ProductImages.Clear();
        if (imageUrls is null)
        {
            return;
        }

        var normalized = imageUrls
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Take(6)
            .ToList();

        foreach (var imageUrl in normalized)
        {
            product.ProductImages.Add(new ProductImage
            {
                ProductId = product.Id,
                ImageUrl = imageUrl.Trim(),
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
