using Finora.Api.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Finora.Api.Data;

public sealed class FinoraDbContext(DbContextOptions<FinoraDbContext> options) : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Account> Accounts => Set<Account>(); public DbSet<Category> Categories => Set<Category>(); public DbSet<Transaction> Transactions => Set<Transaction>(); public DbSet<Budget> Budgets => Set<Budget>(); public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Account>().HasIndex(x => new { x.UserId, x.Name }); b.Entity<Category>().HasIndex(x => new { x.UserId, x.Name }); b.Entity<Transaction>().HasIndex(x => new { x.UserId, x.TransactionDate }); b.Entity<Budget>().HasIndex(x => new { x.UserId, x.CategoryId, x.Month, x.Year }).IsUnique(); b.Entity<RecurringTransaction>().HasIndex(x => new { x.UserId, x.NextOccurrenceDate });
        b.Entity<Account>().Property(x => x.InitialBalance).HasPrecision(18, 2); b.Entity<Transaction>().Property(x => x.Amount).HasPrecision(18, 2); b.Entity<Budget>().Property(x => x.Amount).HasPrecision(18, 2); b.Entity<RecurringTransaction>().Property(x => x.Amount).HasPrecision(18, 2);
    }
}
