FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY pocketbase /app/pocketbase
COPY pb_public /app/pb_public
COPY pb_migrations /app/pb_migrations

RUN chmod +x /app/pocketbase

EXPOSE 8090

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
