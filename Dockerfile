FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM alpine:3 AS downloader
ARG PB_VERSION=0.36.7
ARG TARGETARCH=amd64
RUN apk add --no-cache wget unzip \
    && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
    && unzip /tmp/pb.zip -d /usr/local/bin/ \
    && rm /tmp/pb.zip

FROM alpine:3
RUN apk add --no-cache ca-certificates tzdata
COPY --from=downloader /usr/local/bin/pocketbase /usr/local/bin/pocketbase
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=frontend /app/dist /pb_public
COPY backend/pb_migrations /pb_migrations
COPY backend/pb_hooks /pb_hooks
EXPOSE 8090
ENTRYPOINT ["/entrypoint.sh"]
