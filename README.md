# Temporary Integrated Project

## How to run everything together

Pick either `docker-compose.dev.yml` or `docker-compose.prod.yml` and copy it to `docker-compose.yml`.
For example:

```bash
cp docker-compose.prod.yml docker-compose.yml

docker-compose up --build --remove-orphans
```
