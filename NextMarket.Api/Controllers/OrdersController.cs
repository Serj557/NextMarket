using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;
using NextMarket.Api.Services;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(AppDbContext dbContext, OrderService orderService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await orderService.CreateOrderAsync(request, cancellationToken);
        if (!result.Success || result.Order is null)
        {
            return BadRequest(result.Error);
        }

        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstAsync(x => x.Id == result.Order.Id, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = order.Id, buyerId = order.BuyerId }, ToResponse(order));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<OrderResponse>>> GetMyOrders([FromQuery] Guid buyerId, CancellationToken cancellationToken)
    {
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.BuyerId == buyerId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(orders.Select(ToResponse).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id, [FromQuery] Guid buyerId, CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.BuyerId == buyerId, cancellationToken);

        if (order is null)
        {
            return NotFound("Заказ не найден.");
        }

        return Ok(ToResponse(order));
    }

    [HttpPatch("{id:guid}/complete")]
    public async Task<IActionResult> MarkCompleted(Guid id, [FromBody] SetOrderCompletedRequest request, CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
        {
            return NotFound("Заказ не найден.");
        }

        if (order.BuyerId != request.BuyerId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Нельзя менять чужой заказ.");
        }

        if (order.Status != OrderStatus.Created)
        {
            return BadRequest("Можно завершить только заказ в статусе Created.");
        }

        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static OrderResponse ToResponse(Order order)
    {
        var items = order.Items
            .Select(x => new OrderItemResponse(x.ProductId, x.Quantity, x.UnitPrice))
            .ToList();

        return new OrderResponse(order.Id, order.BuyerId, order.Status.ToString().ToLowerInvariant(), order.CreatedAt, order.CompletedAt, items);
    }
}
