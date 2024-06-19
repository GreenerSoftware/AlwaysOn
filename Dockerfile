################################################################################
# Builder Stage
################################################################################

# We're deploying to the 16-alpine image, so do our building on it too.
FROM node:20-alpine as builder

# By default, we want to do everything in a non-privileged user, so go to their
# home dir and drop to their account.
WORKDIR /home/node
USER node

# We need to transpile a lot of our code, so copy this to the builder image.
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./src/pages/*.njk ./views/
COPY --chown=node:node ./src/pages/**/*.njk ./views/
COPY --chown=node:node ./assets ./assets

# Install all the build, test & run dependencies.
COPY --chown=node:node package*.json ./
RUN npm ci

# Build the `.js` and `.css` from our `.ts` and `.scss` files.
COPY --chown=node:node tsconfig.json ./
RUN npm run build

# Remove all the build & test dependencies but leave the run dependencies.
RUN npm prune --production

################################################################################
# Deployable Image
################################################################################

# We built on the 16-alpine image, so we need to deploy on it too.
FROM node:20-alpine

# Drop back to the non-privileged user for run-time.
WORKDIR /home/node
USER node

# Copy the run dependencies, built code, assets and scripts from the builder.
COPY --chown=node:node --from=builder /home/node/node_modules ./node_modules
COPY --chown=node:node --from=builder /home/node/dist ./dist
COPY --chown=node:node --from=builder /home/node/views ./views
COPY --chown=node:node --from=builder /home/node/assets ./assets
COPY --chown=node:node --from=builder /home/node/package.json ./

# These variables are for overriding as they only matter during run.
ENV DEER_SESSION_SECRET override_this_value
ENV DEER_API_URL override_this_value
ENV DEER_STAFF_HOST_PREFIX override_this_value

# Let docker know our micro-app always runs on port 3305.
EXPOSE 3305

# Run the default start script.
CMD ["npm", "run", "start"]
