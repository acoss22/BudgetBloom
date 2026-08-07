using Finora.Api.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Finora.Api.Data;

public sealed class FinoraDbContext(DbContextOptions<FinoraDbContext> options) : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Account> Accounts => Set<Account>(); public DbSet<Category> Categories => Set<Category>(); public DbSet<Transaction> Transactions => Set<Transaction>(); public DbSet<Budget> Budgets => Set<Budget>(); public DbSet<RecurringTransaction> RecurringTransactions => Set<RecurringTransaction>(); public DbSet<Mortgage> Mortgages => Set<Mortgage>(); public DbSet<HouseholdBill> HouseholdBills => Set<HouseholdBill>(); public DbSet<MedicalExpense> MedicalExpenses => Set<MedicalExpense>(); public DbSet<SupermarketExpense> SupermarketExpenses => Set<SupermarketExpense>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Account>().HasIndex(x => new { x.UserId, x.Name }); b.Entity<Category>().HasIndex(x => new { x.UserId, x.Name }); b.Entity<Transaction>().HasIndex(x => new { x.UserId, x.TransactionDate }); b.Entity<Budget>().HasIndex(x => new { x.UserId, x.CategoryId, x.Month, x.Year }).IsUnique(); b.Entity<RecurringTransaction>().HasIndex(x => new { x.UserId, x.NextOccurrenceDate });
        b.Entity<Mortgage>().HasIndex(x => new { x.UserId, x.Name });
        b.Entity<HouseholdBill>().HasIndex(x => new { x.UserId, x.BillType, x.Name });
        b.Entity<MedicalExpense>().HasIndex(x => new { x.UserId, x.ExpenseDate });
        b.Entity<SupermarketExpense>().HasIndex(x => new { x.UserId, x.ExpenseDate });
        b.Entity<Account>().Property(x => x.InitialBalance).HasPrecision(18, 2); b.Entity<Transaction>().Property(x => x.Amount).HasPrecision(18, 2); b.Entity<Budget>().Property(x => x.Amount).HasPrecision(18, 2); b.Entity<RecurringTransaction>().Property(x => x.Amount).HasPrecision(18, 2);
        b.Entity<Mortgage>().Property(x => x.OriginalPrincipal).HasPrecision(18, 2); b.Entity<Mortgage>().Property(x => x.OutstandingBalance).HasPrecision(18, 2); b.Entity<Mortgage>().Property(x => x.InterestRate).HasPrecision(7, 4); b.Entity<Mortgage>().Property(x => x.MonthlyPayment).HasPrecision(18, 2);
        b.Entity<HouseholdBill>().Property(x => x.Amount).HasPrecision(18, 2);
        b.Entity<MedicalExpense>().Property(x => x.Amount).HasPrecision(18, 2);
        b.Entity<SupermarketExpense>().Property(x => x.Amount).HasPrecision(18, 2);
        b.Entity<Account>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Category>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Transaction>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Transaction>().HasOne<Account>().WithMany().HasForeignKey(x=>x.AccountId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Transaction>().HasOne<Category>().WithMany().HasForeignKey(x=>x.CategoryId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<Budget>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Budget>().HasOne<Category>().WithMany().HasForeignKey(x=>x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<RecurringTransaction>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<RecurringTransaction>().HasOne<Account>().WithMany().HasForeignKey(x=>x.AccountId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<RecurringTransaction>().HasOne<Category>().WithMany().HasForeignKey(x=>x.CategoryId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<Mortgage>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<HouseholdBill>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<MedicalExpense>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<SupermarketExpense>().HasOne<Finora.Api.Identity.ApplicationUser>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
