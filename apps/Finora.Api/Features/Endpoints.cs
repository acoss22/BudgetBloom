using Finora.Api.Data;
using Finora.Api.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Finora.Api.Features;

public sealed record RegisterRequest(string Email, string Password, string DisplayName);
public sealed record LoginRequest(string Email, string Password, bool RememberMe = false);
public sealed record UpdateProfileRequest(string DisplayName, string Email);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public static class Endpoints
{
    public static void MapFinoraEndpoints(this WebApplication app)
    {
        var auth=app.MapGroup("/api/auth");
        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);
        auth.MapPost("/logout", async (SignInManager<ApplicationUser> signIn) => { await signIn.SignOutAsync(); return Results.NoContent(); }).RequireAuthorization();
        auth.MapGet("/me", async (HttpContext context, UserManager<ApplicationUser> users) => { var user=await users.GetUserAsync(context.User); return user is null?Results.Unauthorized():Results.Ok(UserDto(user)); }).RequireAuthorization();
        auth.MapPut("/profile", UpdateProfile).RequireAuthorization();
        auth.MapPut("/password", ChangePassword).RequireAuthorization();

        var api=app.MapGroup("/api").RequireAuthorization();
        api.MapGet("/accounts", (HttpContext c,FinanceService s)=>s.Accounts(FinanceService.UserId(c.User)));
        api.MapPost("/accounts", (HttpContext c,AccountRequest r,FinanceService s)=>s.CreateAccount(FinanceService.UserId(c.User),r));
        api.MapGet("/categories", (HttpContext c,FinanceService s)=>s.Categories(FinanceService.UserId(c.User)));
        api.MapPost("/categories", (HttpContext c,CategoryRequest r,FinanceService s)=>s.CreateCategory(FinanceService.UserId(c.User),r));
        api.MapPut("/categories/{id:guid}", (HttpContext c,Guid id,CategoryRequest r,FinanceService s)=>s.UpdateCategory(FinanceService.UserId(c.User),id,r));
        api.MapGet("/transactions", (HttpContext c,FinanceService s,int page=1,int pageSize=25,Guid? accountId=null,Guid? categoryId=null,TransactionType? type=null,DateOnly? startDate=null,DateOnly? endDate=null,string? search=null)=>s.Transactions(FinanceService.UserId(c.User),Math.Max(1,page),Math.Clamp(pageSize,1,100),accountId,categoryId,type,startDate,endDate,search));
        api.MapPost("/transactions", (HttpContext c,TransactionRequest r,FinanceService s)=>s.CreateTransaction(FinanceService.UserId(c.User),r));
        api.MapGet("/budgets", (HttpContext c,FinanceService s)=>s.Budgets(FinanceService.UserId(c.User)));
        api.MapPost("/budgets", (HttpContext c,BudgetRequest r,FinanceService s)=>s.CreateBudget(FinanceService.UserId(c.User),r));
        api.MapPut("/budgets/{id:guid}", (HttpContext c,Guid id,BudgetRequest r,FinanceService s)=>s.UpdateBudget(FinanceService.UserId(c.User),id,r));
        api.MapGet("/recurring-transactions", (HttpContext c,FinanceService s)=>s.Recurring(FinanceService.UserId(c.User)));
        api.MapPost("/recurring-transactions", (HttpContext c,RecurringRequest r,FinanceService s)=>s.CreateRecurring(FinanceService.UserId(c.User),r));
        api.MapGet("/mortgages", (HttpContext c,FinanceService s)=>s.Mortgages(FinanceService.UserId(c.User)));
        api.MapPost("/mortgages", (HttpContext c,MortgageRequest r,FinanceService s)=>s.CreateMortgage(FinanceService.UserId(c.User),r));
        api.MapPut("/mortgages/{id:guid}", (HttpContext c,Guid id,MortgageRequest r,FinanceService s)=>s.UpdateMortgage(FinanceService.UserId(c.User),id,r));
        api.MapGet("/household-bills", (HttpContext c,FinanceService s)=>s.HouseholdBills(FinanceService.UserId(c.User)));
        api.MapPost("/household-bills", (HttpContext c,HouseholdBillRequest r,FinanceService s)=>s.CreateHouseholdBill(FinanceService.UserId(c.User),r));
        api.MapPut("/household-bills/{id:guid}", (HttpContext c,Guid id,HouseholdBillRequest r,FinanceService s)=>s.UpdateHouseholdBill(FinanceService.UserId(c.User),id,r));
        api.MapGet("/medical-expenses", (HttpContext c,FinanceService s)=>s.MedicalExpenses(FinanceService.UserId(c.User)));
        api.MapPost("/medical-expenses", (HttpContext c,MedicalExpenseRequest r,FinanceService s)=>s.CreateMedicalExpense(FinanceService.UserId(c.User),r));
        api.MapPut("/medical-expenses/{id:guid}", (HttpContext c,Guid id,MedicalExpenseRequest r,FinanceService s)=>s.UpdateMedicalExpense(FinanceService.UserId(c.User),id,r));
        api.MapGet("/supermarket-expenses", (HttpContext c,FinanceService s)=>s.SupermarketExpenses(FinanceService.UserId(c.User)));
        api.MapPost("/supermarket-expenses", (HttpContext c,SupermarketExpenseRequest r,FinanceService s)=>s.CreateSupermarketExpense(FinanceService.UserId(c.User),r));
        api.MapPut("/supermarket-expenses/{id:guid}", (HttpContext c,Guid id,SupermarketExpenseRequest r,FinanceService s)=>s.UpdateSupermarketExpense(FinanceService.UserId(c.User),id,r));
        api.MapGet("/personal-expenses", (HttpContext c,PersonalExpenseArea area,FinanceService s)=>s.PersonalExpenses(FinanceService.UserId(c.User),area));
        api.MapPost("/personal-expenses", (HttpContext c,PersonalExpenseRequest r,FinanceService s)=>s.CreatePersonalExpense(FinanceService.UserId(c.User),r));
        api.MapPut("/personal-expenses/{id:guid}", (HttpContext c,Guid id,PersonalExpenseRequest r,FinanceService s)=>s.UpdatePersonalExpense(FinanceService.UserId(c.User),id,r));
        api.MapGet("/pet-expenses", (HttpContext c,FinanceService s)=>s.PetExpenses(FinanceService.UserId(c.User)));
        api.MapPost("/pet-expenses", (HttpContext c,PetExpenseRequest r,FinanceService s)=>s.CreatePetExpense(FinanceService.UserId(c.User),r));
        api.MapPut("/pet-expenses/{id:guid}", (HttpContext c,Guid id,PetExpenseRequest r,FinanceService s)=>s.UpdatePetExpense(FinanceService.UserId(c.User),id,r));
        MapFinancialProducts(api,"loans",FinancialProductType.Loan);
        MapFinancialProducts(api,"credit-cards",FinancialProductType.CreditCard);
        MapFinancialProducts(api,"debit-cards",FinancialProductType.DebitCard);
        MapFinancialProducts(api,"investments",FinancialProductType.Investment);
        api.MapGet("/dashboard/summary", (HttpContext c,FinanceService s,int month,int year)=>s.DashboardWithRecentActivity(FinanceService.UserId(c.User),month,year));
        api.MapDelete("/{resource}/{id:guid}", Delete);
    }

    private static async Task<IResult> Register(RegisterRequest request, UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signIn, FinoraDbContext db)
    {
        if(string.IsNullOrWhiteSpace(request.DisplayName)||string.IsNullOrWhiteSpace(request.Email)) return Results.ValidationProblem(new Dictionary<string,string[]>{{"registration",["Email and display name are required."]}});
        var user=new ApplicationUser { UserName=request.Email.Trim(), Email=request.Email.Trim(), DisplayName=request.DisplayName.Trim() };
        var result=await users.CreateAsync(user,request.Password);
        if(!result.Succeeded)return Results.ValidationProblem(result.Errors.GroupBy(x=>x.Code).ToDictionary(g=>g.Key,g=>g.Select(x=>x.Description).ToArray()));
        (string Name,string Icon,string Color)[] expense=[("Housing","home","#5B7DB1"),("Groceries","shopping_cart","#4F8A5B"),("Transport","directions_car","#607D8B"),("Utilities","bolt","#D29B35"),("Health","medical_services","#C45B6A"),("Entertainment","sports_esports","#8A65B5"),("Shopping","shopping_bag","#C06C9B"),("Subscriptions","subscriptions","#4B8F9C"),("Other","category","#7A7A7A")];
        (string Name,string Icon,string Color)[] income=[("Salary","payments","#397454"),("Freelance","work","#3E7C8F"),("Investments","monitoring","#6A7F3F"),("Gifts","redeem","#A66A8B"),("Other","add_circle","#607D8B")];
        db.Categories.AddRange(expense.Select(x=>new Category{UserId=user.Id,Name=x.Name,Icon=x.Icon,Color=x.Color,CategoryType=CategoryType.Expense,IsDefault=true}).Concat(income.Select(x=>new Category{UserId=user.Id,Name=x.Name,Icon=x.Icon,Color=x.Color,CategoryType=CategoryType.Income,IsDefault=true})));
        await db.SaveChangesAsync(); await signIn.SignInAsync(user,false); return Results.Ok(UserDto(user));
    }
    private static async Task<IResult> Login(LoginRequest request,UserManager<ApplicationUser> users,SignInManager<ApplicationUser> signIn) { var user=await users.FindByEmailAsync(request.Email); if(user is null||!(await signIn.PasswordSignInAsync(user,request.Password,request.RememberMe,true)).Succeeded)return Results.Problem(statusCode:401,title:"Invalid email or password."); return Results.Ok(UserDto(user)); }
    private static async Task<IResult> UpdateProfile(UpdateProfileRequest request,HttpContext context,UserManager<ApplicationUser> users,SignInManager<ApplicationUser> signIn) { if(string.IsNullOrWhiteSpace(request.DisplayName)||string.IsNullOrWhiteSpace(request.Email))return Results.ValidationProblem(new Dictionary<string,string[]>{{"profile",["Display name and email are required."]}}); var user=await users.GetUserAsync(context.User); if(user is null)return Results.Unauthorized(); user.DisplayName=request.DisplayName.Trim(); user.Email=request.Email.Trim(); user.UserName=request.Email.Trim(); var result=await users.UpdateAsync(user); if(!result.Succeeded)return IdentityValidation(result); await signIn.RefreshSignInAsync(user); return Results.Ok(UserDto(user)); }
    private static async Task<IResult> ChangePassword(ChangePasswordRequest request,HttpContext context,UserManager<ApplicationUser> users,SignInManager<ApplicationUser> signIn) { if(string.IsNullOrWhiteSpace(request.CurrentPassword)||string.IsNullOrWhiteSpace(request.NewPassword))return Results.ValidationProblem(new Dictionary<string,string[]>{{"password",["Current and new passwords are required."]}}); var user=await users.GetUserAsync(context.User); if(user is null)return Results.Unauthorized(); var result=await users.ChangePasswordAsync(user,request.CurrentPassword,request.NewPassword); if(!result.Succeeded)return IdentityValidation(result); await signIn.RefreshSignInAsync(user); return Results.NoContent(); }
    private static IResult IdentityValidation(IdentityResult result)=>Results.ValidationProblem(result.Errors.GroupBy(x=>x.Code).ToDictionary(group=>group.Key,group=>group.Select(x=>x.Description).ToArray()));
    private static object UserDto(ApplicationUser u)=>new {u.Id,u.Email,u.DisplayName,u.CreatedAtUtc};
    private static void MapFinancialProducts(RouteGroupBuilder api,string route,FinancialProductType type) { api.MapGet($"/{route}",(HttpContext c,FinanceService s)=>s.FinancialProducts(FinanceService.UserId(c.User),type)); api.MapPost($"/{route}",(HttpContext c,FinancialProductRequest r,FinanceService s)=>s.CreateFinancialProduct(FinanceService.UserId(c.User),type,r)); api.MapPut($"/{route}/{{id:guid}}",(HttpContext c,Guid id,FinancialProductRequest r,FinanceService s)=>s.UpdateFinancialProduct(FinanceService.UserId(c.User),id,type,r)); }
    private static async Task<IResult> Delete(string resource,Guid id,HttpContext c,FinoraDbContext db) { var uid=FinanceService.UserId(c.User); object? entity=resource switch {"accounts"=>await db.Accounts.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"categories"=>await db.Categories.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"transactions"=>await db.Transactions.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"budgets"=>await db.Budgets.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"mortgages"=>await db.Mortgages.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"household-bills"=>await db.HouseholdBills.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"medical-expenses"=>await db.MedicalExpenses.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"supermarket-expenses"=>await db.SupermarketExpenses.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"personal-expenses"=>await db.PersonalExpenses.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"pet-expenses"=>await db.PetExpenses.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),"loans"=>await db.FinancialProducts.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid&&x.ProductType==FinancialProductType.Loan),"credit-cards"=>await db.FinancialProducts.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid&&x.ProductType==FinancialProductType.CreditCard),"debit-cards"=>await db.FinancialProducts.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid&&x.ProductType==FinancialProductType.DebitCard),"investments"=>await db.FinancialProducts.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid&&x.ProductType==FinancialProductType.Investment),"recurring-transactions"=>await db.RecurringTransactions.FirstOrDefaultAsync(x=>x.Id==id&&x.UserId==uid),_=>null}; if(entity is null)return Results.NotFound(); db.Remove(entity); await db.SaveChangesAsync(); return Results.NoContent(); }
}
