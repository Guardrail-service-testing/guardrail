FROM node:16-alpine
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://172.17.0.1:27017/replay
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
RUN npm ci
COPY . .
EXPOSE 9001
CMD ["npm", "start"]
