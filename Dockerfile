FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git

WORKDIR /src
RUN git clone --depth 1 https://github.com/pocketbase/pocketbase.git .
WORKDIR /src/examples/base
RUN CGO_ENABLED=0 go build -o /pocketbase .

FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /pocketbase /app/pocketbase
COPY pb_public /app/pb_public
COPY pb_migrations /app/pb_migrations

EXPOSE 8090

VOLUME /app/pb_data

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
