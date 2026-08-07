FROM node:22.22-alpine AS frontend-build
WORKDIR /src/frontend
COPY apps/finora-web/package*.json ./
RUN npm ci
COPY apps/finora-web/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src/api
COPY apps/Finora.Api/Finora.Api.csproj ./
RUN dotnet restore
COPY apps/Finora.Api/ ./
RUN dotnet publish -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=api-build /app ./
COPY --from=frontend-build /src/frontend/dist/finora-web/browser ./wwwroot
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "Finora.Api.dll"]
