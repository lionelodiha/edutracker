# Build stage — .NET 10 SDK. Build context must be the REPO ROOT
# (central package management + shared props live there):
#   docker build -f backend/EduTracker.Api/Dockerfile .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy central build files + project files first for layer caching.
COPY Directory.Build.props Directory.Packages.props ./
COPY backend/EduTracker.Api/EduTracker.Api.csproj backend/EduTracker.Api/
COPY backend/EduTracker.Application/EduTracker.Application.csproj backend/EduTracker.Application/
COPY backend/EduTracker.Domain/EduTracker.Domain.csproj backend/EduTracker.Domain/
COPY backend/EduTracker.Infrastructure/EduTracker.Infrastructure.csproj backend/EduTracker.Infrastructure/
COPY backend/EduTracker.Persistence/EduTracker.Persistence.csproj backend/EduTracker.Persistence/
RUN dotnet restore backend/EduTracker.Api/EduTracker.Api.csproj

# Copy backend sources and publish.
COPY backend/ backend/
RUN dotnet publish backend/EduTracker.Api/EduTracker.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
# curl powers the container HEALTHCHECK against /health/ready. Installed as
# root before dropping to the unprivileged user.
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
USER app
ENTRYPOINT ["dotnet", "EduTracker.Api.dll"]
