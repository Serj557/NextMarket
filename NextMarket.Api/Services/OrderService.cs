using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Services;

public class OrderService(AppDbContext dbContext)
{
    public async Task<(bool Success, string? Error, Order? Order)> CreateOrderAsync(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var buyerExists = await dbContext.Users.AnyAsync(x => x.Id == request.BuyerId, cancellationToken);
        if (!buyerExists)
        {
            return (false, "Покупатель не найден.", null);
        }

        var requestedProductIds = request.Items.Select(x => x.ProductId).Distinct().ToList();
        var products = await dbContext.Products
            .Where(x => requestedProductIds.Contains(x.Id) && x.IsActive)
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        if (products.Count != requestedProductIds.Count)
        {
            return (false, "Некоторые товары не найдены или недоступны.", null);
        }

        foreach (var item in request.Items)
        {
            var product = products[item.ProductId];

            if (product.SellerId == request.BuyerId)
            {
                return (false, "Нельзя купить собственный товар.", null);
            }

            if (product.StockQty < item.Quantity)
            {
                return (false, $"Недостаточно товара на складе: {product.Title}.", null);
            }
        }

        using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var order = new Order
        {
            BuyerId = request.BuyerId,
            Status = OrderStatus.Created
        };

        foreach (var item in request.Items)
        {
            var product = products[item.ProductId];
            product.StockQty -= item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });
        }

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return (true, null, order);
    }
}
