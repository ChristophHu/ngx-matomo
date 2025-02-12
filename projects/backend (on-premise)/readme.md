# Matomo On-Premise
Matomo is the leading open-source analytics platform that gives you more than powerful analytics. It also protects your data by keeping it on your server. Matomo On-Premise is the self-hosted version of Matomo. This means you can install Matomo on your own server and get full control over your data.

## Installation
To install Matomo On-Premise, follow the instructions in the [Matomo On-Premise Installation Guide](https://matomo.org/docs/installation/).

## Documentation
https://dev.to/fborges42/using-matomo-on-angular-l3d
https://goneuland.de/matomo-frueher-piwik-mit-docker-compose-und-traefik-installieren/

## Vorbereitung

### Docker
```yaml
version: "3"

services:
  db:
    image: mysql
    command: --max-allowed-packet=64MB
    restart: always
    volumes:
      - db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=matomo
    env_file:
      - ./db.env

  app:
    image: matomo:fpm-alpine
    restart: always
    links:
      - db
    volumes:
      - matomo:/var/www/html
    environment:
      - MATOMO_DATABASE_HOST=db
      - PHP_MEMORY_LIMIT=2048M
    env_file:
      - ./db.env

  web:
    image: nginx:alpine
    restart: always
    volumes:
      - matomo:/var/www/html:ro
      - ./matomo.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - 8080:80

volumes:
  db:
  matomo:
```

### Environment
Die `db.env` Datei enthält die Umgebungsvariablen für die Datenbank:

```env
MYSQL_PASSWORD=matomo
MYSQL_DATABASE=matomo
MYSQL_USER=matomo
MATOMO_DATABASE_ADAPTER=mysql
MATOMO_DATABASE_TABLES_PREFIX=matomo_
MATOMO_DATABASE_USERNAME=matomo
MATOMO_DATABASE_PASSWORD=matomo
MATOMO_DATABASE_DBNAME=matomo
```

### Nginx Konfiguration
In der Datei `matomo.conf` wird die Nginx Konfiguration für Matomo definiert:
```conf
upstream php-handler {
    server app:9000;
}

server {
    listen 80;

    add_header Referrer-Policy origin; # make sure outgoing links don't show the URL to the Matomo instance
    root /var/www/html; # replace with path to your matomo instance
    index index.php;
    try_files $uri $uri/ =404;

    ## only allow accessing the following php files
    location ~ ^/(index|matomo|piwik|js/index|plugins/HeatmapSessionRecording/configs).php {
        # regex to split $uri to $fastcgi_script_name and $fastcgi_path
        fastcgi_split_path_info ^(.+\.php)(/.+)$;

        # Check that the PHP script exists before passing it
        try_files $fastcgi_script_name =404;

        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        fastcgi_param HTTP_PROXY ""; # prohibit httpoxy: https://httpoxy.org/
        fastcgi_pass php-handler;
    }

    ## deny access to all other .php files
    location ~* ^.+\.php$ {
        deny all;
        return 403;
    }

    ## disable all access to the following directories
    location ~ /(config|tmp|core|lang) {
        deny all;
        return 403; # replace with 404 to not show these directories exist
    }
    location ~ /\.ht {
        deny all;
        return 403;
    }

    location ~ js/container_.*_preview\.js$ {
        expires off;
        add_header Cache-Control 'private, no-cache, no-store';
    }

    location ~ \.(gif|ico|jpg|png|svg|js|css|htm|html|mp3|mp4|wav|ogg|avi|ttf|eot|woff|woff2|json)$ {
        allow all;
        ## Cache images,CSS,JS and webfonts for an hour
        ## Increasing the duration may improve the load-time, but may cause old files to show after an Matomo upgrade
        expires 1h;
        add_header Pragma public;
        add_header Cache-Control "public";
    }

    location ~ /(libs|vendor|plugins|misc/user) {
        deny all;
        return 403;
    }

    ## properly display textfiles in root directory
    location ~/(.*\.md|LEGALNOTICE|LICENSE) {
        default_type text/plain;
    }
}

# vim: filetype=nginx
```

### Start
Durch das folgende Kommando wird Matomo gestartet:
```bash
docker-compose up -d
```

Wie in der Docker Compose Datei definiert, ist Matomo unter `http://localhost:8080` erreichbar.

## Matomo Konfiguration
