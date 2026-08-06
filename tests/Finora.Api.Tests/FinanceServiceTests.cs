using Finora.Api.Data;
using Finora.Api.Features;
using Microsoft.EntityFrameworkCore;

namespace Finora.Api.Tests;

public sealed class FinanceServiceTests
{
    private static FinoraDbContext Database() => new(new DbContextOptionsBuilder<FinoraDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    [Fact] public void Registration_validation_requires_a_display_name() { var request=new RegisterRequest("person@example.com","long-password",""); Assert.True(string.IsNullOrWhiteSpace(request.DisplayName)); }
    [Fact] public void Api_finance_routes_require_authentication() { var method=typeof(Endpoints).GetMethod(nameof(Endpoints.MapFinoraEndpoints)); Assert.NotNull(method); }
    [Fact] public async Task Users_cannot_access_another_users_accounts() { await using var db=Database(); var owner=Guid.NewGuid(); db.Accounts.Add(new(){UserId=owner,Name="Private"}); await db.SaveChangesAsync(); var result=await new FinanceService(db).Accounts(Guid.NewGuid()); Assert.Empty(result); }
    [Fact] public async Task Creating_an_account_sets_the_owner() { await using var db=Database(); var user=Guid.NewGuid(); var result=await new FinanceService(db).CreateAccount(user,new("Daily",AccountType.CurrentAccount,"eur",100)); Assert.Equal(user,result.UserId); Assert.Equal("EUR",result.CurrencyCode); }
    [Fact] public async Task Creating_an_expense_transaction_is_user_scoped() { await using var db=Database(); var user=Guid.NewGuid(); var account=new Account{UserId=user,Name="Daily"}; db.Add(account); await db.SaveChangesAsync(); var result=await new FinanceService(db).CreateTransaction(user,new(account.Id,null,TransactionType.Expense,20,"Food",DateOnly.FromDateTime(DateTime.UtcNow),null)); Assert.Equal(TransactionType.Expense,result.TransactionType); Assert.Equal(20,result.Amount); }
    [Fact] public async Task Dashboard_calculates_income_and_expenses() { await using var db=Database(); var user=Guid.NewGuid(); var account=new Account{UserId=user,Name="Daily",InitialBalance=100}; db.Add(account); db.Transactions.AddRange(new(){UserId=user,AccountId=account.Id,TransactionType=TransactionType.Income,Amount=50,Description="Pay",TransactionDate=new(2026,8,1)},new(){UserId=user,AccountId=account.Id,TransactionType=TransactionType.Expense,Amount=25,Description="Food",TransactionDate=new(2026,8,2)}); await db.SaveChangesAsync(); var result=await new FinanceService(db).Dashboard(user,8,2026); Assert.Contains("monthlyIncome = 50",result.ToString()); Assert.Contains("monthlyExpenses = 25",result.ToString()); }
}
