using Finora.Api.Data;
using Finora.Api.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Finora.Api.Features;

public sealed record RegisterRequest(string Email, string Password, string DisplayName);
public sealed record LoginRequest(string Email, string Password);

public static class Endpoints
{
    public static void MapFinoraEndpoints(this WebApplication app)
    {
        var auth=app.MapGroup("/api/auth");
        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);
        auth.MapPost("/logout", async (SignInManager<ApplicationUser> signIn) => { await signIn.SignOutAsync(); return Results.NoContent(); }).RequireAuthorization();
        auth.MapGet("/me", async (HttpContext context, UserManager<ApplicationUser> users) => { var user=await users.GetUserAsync(context.User); return user is null?Results.Unauthorized():Results.Ok(UserDto(user)); }).RequireAuthorization();

        var api=app.MapGroup("/api").RequireAuthorization();
        api.MapGet("/accounts", (HttpContext c,FinanceService s)=>s.Accounts(FinanceService.UserId(c.User)));
        api.MapPost("/accounts", (HttpContext c,AccountRequest r,FinanceService s)=>s.CreateAccount(FinanceService.UserId(c.User),r));
        api.MapGet("/categories", (HttpContext c,FinanceService s)=>s.Categories(FinanceService.UserId(c.User)));
        api.MapPost("/categories", (HttpContext c,CategoryRequest r,FinanceService s)=>s.CreateCategory(FinanceService.UserId(c.User),r));
        api.MapGet("/transactions", (HttpContext c,FinanceService s,int page=1,int pageSize=25,Guid? accountId=null,Guid? categoryId=null,TransactionType? type=null,DateOnly? startDate=null,DateOnly? endDate=null,string? search=null)=>s.Transactions(FinanceService.UserId(c.User),Math.Max(1,page),Math.Clamp(pageSize,1,100),accountId,categoryId,type,startDate,endDate,search));
        api.MapPost("/transactions", (HttpContext c,TransactionRequest r,FinanceService s)=>s.CreateTransaction(FinanceService.UserId(c.User),r));
        api.MapGet("/budgets", (HttpContext c,FinanceService s)=>s.Budgets(FinanceService.UserId(c.User)));
        api.MapPost("/budgets", (HttpContext c,BudgetRequest r,FinanceService s)=>s.CreateBudget(FinanceService.UserId(c.User),r));
        api.MapGet("/recurring-transactions", (HttpContext c,FinanceService s)=>s.Recurring(FinanceService.UserId(c.User)));
        api.MapPost("/recurring-transactions", (HttpContext c,RecurringRequest r,FinanceService s)=>s.CreateRecurring(FinanceService.UserId(c.User),r));
        api.MapGet("/mortgages", (HttpContext c,FinanceService s)=>s.Mortgages(FinanceService.UserId(c.User)));
        api.MapPost("/mortgages", (HttpContext c,MortgageRequest r,FinanceService s)=>s.CreateMortgage(FinanceService.UserId(c.User),r));
        api.MapPut("/mortgages/{id:guid}", (HttpContext c,Guid id,MortgageRequest r,FinanceService s)=>s.UpdateMortgage(FinanceService.UserId(c.User),id,r));
        api.MapGet("/dashboard/summary", (HttpContext c,FinanceService s,int month,int year)=>s.Dashboard(FinanceService.UserId(c.User),month,year));
        api.MapDelete("/{resource}/{id:guid}", Delete);
    }

    private static async Task<IResult> Register(RegisterRequest request, UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn, FinoraDbContext db)
    {
        if(string.IsNullOrWhiteSpace(request.DisplayName)||string.IsNullOrWhiteSpace(request.Email)) return Results.ValidationProblem(new Dictionary<string,string[]>{{"registration",["Email and display name are required."]}});
        var user=new ApplicationUser { UserName=request.Email.Trim(), Email=request.Email.Trim(), DisplayName=request.DisplayName.Trim() };
        var result=await users.CreateAsync(user,request.Password);
        if(!result.Succeeded)return Results.ValidationProblem(result.Errors.GroupBy(x=>x.Code).ToDictionary(g=>g.Key,g=>g.Select(x=>x.Description).ToArray()));
        string[] expense=["Housing","Groceries","Transport","Utilities","Health","Entertainment","Shopping","Subscriptions","Other"];
        string[] income=["Salary","Freelance","Investments","Gifts","Other"];
        db.Categories.AddRange(expense.Select(x=>new Category{UserId=user.Id,Name=x,CategoryType=CategoryType.Expense,IsDefault=true}).Concat(income.Select(x=>new Category{UserId=user.Id,Name=x,CategoryType=CategoryType.Income,IsDefault=true})));
        await db.SaveChangesAsync(); await signIn.SignInAsync(user,false); return Results.Ok(UserDto(user));
    }
    private static async Task<IResult> Login(LoginRequest request,UserManager<ApplicationUser> users,SignInManager<ApplicationUser> signIn) { var user=await users.FindByEmailAsync(request.Email); if(user is null||!(await signIn.PasswordSignInAsync(user,request.Password,true,true)).Succeeded)return Results.Problem(statusCode:401,title:"Invalid email or password."); return Results.Ok(UserDto(user)); }
    private static object UserDto(ApplicationUser u)=>new {u.Id,u.Email,u.DisplayName,u.CreatedAtUtc};
    private static async Task<IResult> Delete(string resource,Guid id,HttpContext c,FinoraDbContext db) { var uid=FinanceService.UserId(c.User); object? entity=resource switch {"accounts"=>await db.Accounts.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"categories"=>await db.Categories.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"transactions"=>await db.Transactions.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"budgets"=>await db.Budgets.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"mortgages"=>await db.Mortgages.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"recurring-transactions"=>await db.RecurringTransactions.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),_=>null}; if(entity is null)return Results.NotFound(); db.Remove(entity); await db.SaveChangesAsync(); return Results.NoContent(); }
}
