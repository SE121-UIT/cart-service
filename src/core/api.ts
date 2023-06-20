import express, { Application, Router, NextFunction, Request, Response } from 'express';
import http from 'http';
import createError, { HttpError } from 'http-errors';
import { ResJSON } from 'src/shoppingCarts/routes';

export const startAPI = (router: Router) => {
  const app: Application = express();

  app.set('etag', false);
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(router);

  // Handle error
  app.use((req, res, next: NextFunction) => {
    next(createError.NotFound('This route does not exist.'));
  });

  app.use((err: HttpError, req: Request, res: Response<ResJSON>) => {
    res.status(err.statusCode || 500).json({
      statusCode: err.statusCode || 500,
      message: err.message,
      error: err.name,
    });
  });

  const server = http.createServer(app);

  server.listen(4999);

  server.on('listening', () => {
    console.info('server up listening');
  });
};
