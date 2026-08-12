# Build Stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Build Arguments
ARG VITE_API_URL
ARG VITE_ENABLE_MICROSOFT_LOGIN
ARG VITE_VPS_IP
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_MICROSOFT_LOGIN=$VITE_ENABLE_MICROSOFT_LOGIN
ENV VITE_VPS_IP=$VITE_VPS_IP

COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
