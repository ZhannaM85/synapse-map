import express from 'express';
import cors from 'cors';
import graphRoutes from './routes/graph.js';
import searchRoutes from './routes/search.js';
import statusRoutes from './routes/status.js';
import scanRoutes from './routes/scan.js';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/graph', graphRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/status', statusRoutes);
  app.use('/api/scan', scanRoutes);

  return app;
}
