#!/bin/sh
set -e

if [ "$RUN_OUTBOX_WORKER" = "false" ]; then
  echo "==> RUN_OUTBOX_WORKER=false, skipping outbox worker"
else
  echo "==> Starting outbox worker in this container"
  dotnet /app/worker/EduTracker.Worker.dll &
fi

exec dotnet /app/api/EduTracker.Api.dll
