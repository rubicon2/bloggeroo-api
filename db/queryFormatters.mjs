import { formatters, processors } from 'url-query-to-prisma';

const blogsQueryFormatter = {
  ownerId: formatters.where(),
  title: formatters.where('contains', { mode: 'insensitive' }),
  body: formatters.where('contains', { mode: 'insensitive' }),
  fromDate: formatters.groupWhere('publishedAt', 'gte', processors.date),
  toDate: formatters.groupWhere('publishedAt', 'lte', processors.date),
};

const commentsQueryFormatter = {
  blogId: formatters.where(),
  ownerId: formatters.where(),
  parentCommentId: formatters.where(),
  text: formatters.where('contains', { mode: 'insensitive' }),
  fromDate: formatters.groupWhere('createdAt', 'gte', processors.date),
  toDate: formatters.groupWhere('createdAt', 'lte', processors.date),
};

const usersQueryFormatter = {
  userId: formatters.where(),
  email: formatters.where('contains', { mode: 'insensitive' }),
  name: formatters.where('contains', { mode: 'insensitive' }),
  isAdmin: formatters.where('contains', { mode: 'insensitive' }),
  isBanned: formatters.where('contains', { mode: 'insensitive' }),
  fromCreatedDate: formatters.groupWhere('createdAt', 'gte', processors.date),
  toCreatedDate: formatters.groupWhere('createdAt', 'lte', processors.date),
  fromUpdatedDate: formatters.groupWhere('updatedAt', 'gte', processors.date),
  toUpdatedDate: formatters.groupWhere('updatedAt', 'lte', processors.date),
};

export { blogsQueryFormatter, commentsQueryFormatter, usersQueryFormatter };
