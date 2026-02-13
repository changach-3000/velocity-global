import express from 'express';
import stripeRouter from './stripe.js';
import bulkLessonsRouter from './bulkLessons.js';
import healthCheckRouter from './health-check.js';
import diagnosticRouter from './diagnostic.js';
import contactRouter from './contact.js';

export default function routes() {
  const router = express.Router();
  
  router.use('/stripe', stripeRouter);
  router.use('/bulk-lessons', bulkLessonsRouter);
  router.use('/health', healthCheckRouter);
  router.use('/diagnostic', diagnosticRouter);
  router.use('/contact', contactRouter);
  
  return router;
}
