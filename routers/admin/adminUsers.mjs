import * as controller from '../../controllers/users.mjs';
import { usersQueryFormatter } from '../../db/queryFormatters.mjs';
import {
  createUserChain as validateUser,
  createNewUserChain as validateNewUser,
} from '../../middleware/validators.mjs';
import usersRouter from '../users.mjs';

import { urlQueryToPrisma } from 'url-query-to-prisma';
import { Router } from 'express';

const app = Router();

app.get(
  '/',
  urlQueryToPrisma('query', usersQueryFormatter),
  controller.getUsers,
);
app.post('/', validateNewUser(), controller.postUser);
app.put('/:userId', validateUser(), controller.putUser);
app.delete('/:userId', controller.deleteUser);

// So user has access to all the same routes from /admin/users as they do from /users.
// usersRouter only has a route to get a singular user, but still nice to have on the same route here!
app.use('/', usersRouter);

export default app;
