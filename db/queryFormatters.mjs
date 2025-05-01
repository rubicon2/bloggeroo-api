import { formatters, processors } from 'url-query-to-prisma';

const blogsQueryFormatter = {
  title: formatters.where('contains', { mode: 'insensitive' }),
  fromDate: formatters.groupWhere('publishedAt', 'gte', processors.date),
  toDate: formatters.groupWhere('publishedAt', 'lte', processors.date),
};

export { blogsQueryFormatter };
