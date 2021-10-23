FROM node:14-alpine
RUN apk add --no-cache chromium
WORKDIR /
COPY . . 
RUN yarn install 
CMD ["yarn", "start"]