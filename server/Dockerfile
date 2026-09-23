FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node server ./server
RUN mkdir -p /data /media && chown node:node /data /media
USER node
ENV HOST=0.0.0.0 PORT=3001 DATABASE_PATH=/data/learnai.sqlite MEDIA_DIR=/media
EXPOSE 3001
CMD ["node", "server/api.mjs"]
