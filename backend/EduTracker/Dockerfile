FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EduTracker.csproj", "./"]
RUN dotnet restore "EduTracker.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "EduTracker.csproj" -c Release -o /app/build
FROM build AS publish
RUN dotnet publish "EduTracker.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EduTracker.dll"]
