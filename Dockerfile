FROM nginx:alpine

# Remove default config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy Angular build
COPY dist/cop-platform-frontend /usr/share/nginx/html

# Fix permissions
RUN chmod -R 755 /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080