using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Pull connection string from the environment variable provided by docker-compose
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DemoDbContext>(options =>
    options.UseSqlServer(connectionString));

var app = builder.Build();

// Database startup resilience loop
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DemoDbContext>();
    int retryCount = 0;
    while (retryCount < 6)
    {
        try
        {
            // Automatically creates the database and schema inside SQL Server if they don't exist
            dbContext.Database.EnsureCreated();
            Console.WriteLine("Database initialization succeeded.");
            break;
        }
        catch (Exception ex)
        {
            retryCount++;
            Console.WriteLine($"SQL Server is starting up... Retrying connection ({retryCount}/6)... Error: {ex.Message}");
            Thread.Sleep(8000); // Wait 8 seconds before retrying
        }
    }
}

// Route 1: Base endpoint to verify the API is alive
app.MapGet("/", () => "C# Web API is running smoothly!");

// Route 2: Test endpoint to verify C# can talk to SQL Server
app.MapGet("/test-db", async (DemoDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        if (canConnect)
        {
            return Results.Ok(new { status = "Success", message = "Connected to SQL Server successfully from C#!" });
        }
        return Results.Problem("Unable to reach SQL Server.");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Database Exception: {ex.Message}");
    }
});

app.Run();

// Minimal Database Context & Test Schema
public class DemoDbContext : DbContext
{
    public DemoDbContext(DbContextOptions<DemoDbContext> options) : base(options) { }
    public DbSet<DemoItem> DemoItems => Set<DemoItem>();
}

public class DemoItem
{
    public int Id { get; set; }
    public string Note { get; set; } = string.Empty;
}