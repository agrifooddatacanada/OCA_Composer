# Multi-stage build for React app (CRACO) producing static assets only

############################
# Build stage
############################
FROM node:18-alpine AS build

# Build-time ARG for CRA environment variables (e.g., analytics id)
ARG REACT_APP_GA_ID
ENV REACT_APP_GA_ID=$REACT_APP_GA_ID

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the production bundle
RUN npm run build

############################
# Assets-only stage (no web server)
############################
FROM alpine:3.19 AS assets

WORKDIR /app

# Copy build artifacts
COPY --from=build /app/build /app/build

# This image contains only static files under /app/build
# Serve with a separate web server container (e.g., nginx:alpine)


