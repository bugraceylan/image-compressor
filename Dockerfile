# Build the static bundle; dist/ is not committed.
FROM node:24-alpine AS build
WORKDIR /app
# Manifests first so the dependency layer is cached when only sources change.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve with unprivileged nginx: runs as non-root and listens on 8080.
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
