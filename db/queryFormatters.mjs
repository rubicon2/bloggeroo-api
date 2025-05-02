import { formatters, processors } from 'url-query-to-prisma';

const blogsQueryFormatter = {
  title: formatters.where('contains', { mode: 'insensitive' }),
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

export { blogsQueryFormatter, commentsQueryFormatter };
