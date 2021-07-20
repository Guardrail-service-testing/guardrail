# app1

To get it working, set:
```bash
POSTGRES_DB=traffic_replay
POSTGRES_PORT=5432
POSTGRES_USER=
POSTGRES_PASSWORD=
```

The app listens on PORT 9001

| method | path | notes
|---|---|---|
|post|/replays | This path will accept JSON bodies of the request, response, and replayed response.|
|get |/all| This returns all the records as a JSON|