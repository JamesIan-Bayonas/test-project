import { Router } from 'express';
import { SearchController } from './search.controller';

const router = Router();
const controller = new SearchController();

// GET /api/search?q=milk&lang=de&page=1
router.get('/', (req, res, next) => controller.search(req, res, next));

export const searchRouter = router;