using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Contracts;
using NextMarket.Api.Data;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterUserRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var exists = await dbContext.Users.AnyAsync(x => x.Email == email, cancellationToken);
        if (exists)
        {
            return Conflict("Пользователь с таким email уже существует.");
        }

        var user = new User
        {
            Email = email,
            Name = request.Name.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginUserRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null)
        {
            return Unauthorized("Неверный email или пароль.");
        }

        var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!validPassword)
        {
            return Unauthorized("Неверный email или пароль.");
        }

        return Ok(ToAuthResponse(user));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<UserResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => ToResponse(x))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (user is null)
        {
            return NotFound("Пользователь не найден.");
        }

        return Ok(ToResponse(user));
    }

    private static UserResponse ToResponse(User user) => new(user.Id, user.Email, user.Name, user.CreatedAt);
    private static AuthResponse ToAuthResponse(User user) =>
        new(Convert.ToBase64String(Guid.NewGuid().ToByteArray()), user.Id, user.Email, user.Name);
}
