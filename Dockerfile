FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY pocketbase /app/pocketbase
COPY pb_public /app/pb_public

RUN chmod +x /app/pocketbase

EXPOSE 8090

VOLUME /app/pb_data

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
