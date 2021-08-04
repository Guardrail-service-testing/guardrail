FROM node:14-alpine
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://172.17.0.1:27017/replay
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 9001
CMD ["npm", "start"]
