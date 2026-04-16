using Microsoft.EntityFrameworkCore;
using NextMarket.Api.Domain;

namespace NextMarket.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<ProductRating> ProductRatings => Set<ProductRating>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.ToTable(x =>
            {
                x.HasCheckConstraint("ck_products_price_gt_0", "\"price\" > 0");
                x.HasCheckConstraint("ck_products_stock_qty_gte_0", "\"stock_qty\" >= 0");
            });
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.SellerId).HasColumnName("seller_id").IsRequired();
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.Price).HasColumnName("price").HasPrecision(18, 2).IsRequired();
            entity.Property(x => x.StockQty).HasColumnName("stock_qty").IsRequired();
            entity.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasIndex(x => x.SellerId);
            entity.HasIndex(x => x.IsActive);

            entity.HasOne(x => x.Seller)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.SellerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BuyerId).HasColumnName("buyer_id").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(x => x.CompletedAt).HasColumnName("completed_at");

            entity.HasIndex(x => new { x.BuyerId, x.CreatedAt });

            entity.HasOne(x => x.Buyer)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.ToTable(x =>
            {
                x.HasCheckConstraint("ck_order_items_quantity_gt_0", "\"quantity\" > 0");
                x.HasCheckConstraint("ck_order_items_unit_price_gt_0", "\"unit_price\" > 0");
            });
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrderId).HasColumnName("order_id").IsRequired();
            entity.Property(x => x.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(x => x.Quantity).HasColumnName("quantity").IsRequired();
            entity.Property(x => x.UnitPrice).HasColumnName("unit_price").HasPrecision(18, 2).IsRequired();

            entity.HasIndex(x => x.OrderId);
            entity.HasIndex(x => x.ProductId);

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductRating>(entity =>
        {
            entity.ToTable("product_ratings");
            entity.ToTable(x =>
            {
                x.HasCheckConstraint("ck_product_ratings_rating_between_1_5", "\"rating\" >= 1 AND \"rating\" <= 5");
            });
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(x => x.Rating).HasColumnName("rating").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasIndex(x => x.ProductId);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => new { x.ProductId, x.UserId }).IsUnique();

            entity.HasOne(x => x.Product)
                .WithMany(x => x.Ratings)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.ProductRatings)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("cart_items");
            entity.ToTable(x =>
            {
                x.HasCheckConstraint("ck_cart_items_quantity_gt_0", "\"quantity\" > 0");
            });
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BuyerId).HasColumnName("buyer_id").IsRequired();
            entity.Property(x => x.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(x => x.Quantity).HasColumnName("quantity").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasIndex(x => x.BuyerId);
            entity.HasIndex(x => x.ProductId);
            entity.HasIndex(x => new { x.BuyerId, x.ProductId }).IsUnique();

            entity.HasOne(x => x.Buyer)
                .WithMany(x => x.CartItems)
                .HasForeignKey(x => x.BuyerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.CartItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.ToTable("favorites");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.BuyerId).HasColumnName("buyer_id").IsRequired();
            entity.Property(x => x.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasIndex(x => x.BuyerId);
            entity.HasIndex(x => x.ProductId);
            entity.HasIndex(x => new { x.BuyerId, x.ProductId }).IsUnique();

            entity.HasOne(x => x.Buyer)
                .WithMany(x => x.Favorites)
                .HasForeignKey(x => x.BuyerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.Favorites)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("product_images");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(x => x.ImageUrl).HasColumnName("image_url").IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasIndex(x => x.ProductId);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.ProductImages)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
