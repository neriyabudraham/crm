FROM node:20-alpine

RUN apk add --no-cache build-base g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev python3

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# התקנת פונט עברי במערכת
RUN mkdir -p /usr/share/fonts/custom && cp -f fonts/Assistant-Regular.ttf /usr/share/fonts/custom/ 2>/dev/null || true
RUN fc-cache -f 2>/dev/null || true

EXPOSE 3010

CMD ["node", "src/app.js"]
