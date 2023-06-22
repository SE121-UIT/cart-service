# base image
FROM node:16-alpine

# set working directory
WORKDIR /app

# copy package.json and package-lock.json
COPY package*.json ./
COPY tsconfig.build.json ./

# install dependencies
RUN npm install

# copy app source code
COPY . .

# build ts -> js
RUN npm run build

# expose port 4999
EXPOSE 4999

# start the app
CMD ["npm", "run", "start"]