import healthRouter from './health.js';
import resourcesRouter from './resources.js';
import disastersRouter from './disasters.js';
import demandRequestsRouter from './demandRequests.js';
import allocationsRouter from './allocations.js';
import volunteersRouter from './volunteers.js';
import transportsRouter from './transports.js';
import dispatchesRouter from './dispatches.js';
import storageLocationsRouter from './storageLocations.js';
import analyticsRouter from './analytics.js';
import accessRouter from './access.js';
import authRouter from './auth.js';

const registerRoutes = (app) => {
  app.use('/api/health', healthRouter);
  app.use('/api/resources', resourcesRouter);
  app.use('/api/disasters', disastersRouter);
  app.use('/api/demand-requests', demandRequestsRouter);
  app.use('/api/allocations', allocationsRouter);
  app.use('/api/volunteers', volunteersRouter);
  app.use('/api/transports', transportsRouter);
  app.use('/api/dispatches', dispatchesRouter);
  app.use('/api/storage-locations', storageLocationsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/access', accessRouter);
  app.use('/api/auth', authRouter);
};

export default registerRoutes;
