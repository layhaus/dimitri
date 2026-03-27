FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN cp node_modules/occt-import-js/dist/occt-import-js.wasm public/ && npm run build

FROM golang:1.25-alpine AS backend
RUN apk add --no-cache git
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /dimitri .

FROM alpine:3
RUN apk add --no-cache ca-certificates tzdata
COPY --from=backend /dimitri /usr/local/bin/dimitri
COPY --from=frontend /app/dist /pb_public
EXPOSE 8090
ENV PB_PUBLIC_DIR=/pb_public
CMD ["dimitri", "serve", "--http=0.0.0.0:8090"]
