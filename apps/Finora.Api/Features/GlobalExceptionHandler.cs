using Microsoft.AspNetCore.Diagnostics;

namespace Finora.Api.Features;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken token)
    {
        logger.LogError(exception, "Unhandled request error");
        var status = exception switch { ArgumentException => 400, KeyNotFoundException => 404, _ => 500 };
        context.Response.StatusCode = status;
        await Results.Problem(statusCode: status, title: status == 500 ? "An unexpected error occurred." : exception.Message).ExecuteAsync(context);
        return true;
    }
}
