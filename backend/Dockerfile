# Joint Render image: API + outbox worker in one container.
# The API serves HTTP on 8080; the worker drains the outbox in the background.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY Directory.Build.props Directory.Packages.props nuget.config     ./
COPY shared-config/                                                   shared-config/

COPY backend/src/EduTracker.Domain/EduTracker.Domain.csproj                   backend/src/EduTracker.Domain/
COPY backend/src/EduTracker.Persistence/EduTracker.Persistence.csproj         backend/src/EduTracker.Persistence/
COPY backend/src/EduTracker.Application/EduTracker.Application.csproj         backend/src/EduTracker.Application/
COPY backend/src/EduTracker.Infrastructure/EduTracker.Infrastructure.csproj   backend/src/EduTracker.Infrastructure/
COPY backend/src/EduTracker.Shared/EduTracker.Shared.csproj                   backend/src/EduTracker.Shared/
COPY backend/src/EduTracker.Api/EduTracker.Api.csproj                         backend/src/EduTracker.Api/
COPY backend/src/EduTracker.Worker/EduTracker.Worker.csproj                   backend/src/EduTracker.Worker/

RUN dotnet restore backend/src/EduTracker.Api/EduTracker.Api.csproj && dotnet restore backend/src/EduTracker.Worker/EduTracker.Worker.csproj

COPY backend/         backend/

RUN dotnet publish backend/src/EduTracker.Api/EduTracker.Api.csproj -c Release -o /app/api --no-restore
RUN dotnet publish backend/src/EduTracker.Worker/EduTracker.Worker.csproj -c Release -o /app/worker --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

COPY --from=build /app/api          /app/api
COPY --from=build /app/worker       /app/worker

COPY --chmod=755 backend/entrypoint.combined.sh /app/entrypoint.sh

USER $APP_UID

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
