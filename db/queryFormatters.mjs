import { formatters, processors } from 'url-query-to-prisma';

const blogsQueryFormatter = {
  blogId: formatters.where({ tableColName: 'id' }),
  ownerId: formatters.where(),
  author: formatters.whereContains({
    caseSensitive: false,
    tableColName: 'owner.name',
  }),
  title: formatters.whereContains({ caseSensitive: false }),
  body: formatters.whereContains({ caseSensitive: false }),
  publishedAt: formatters.where({
    valueProcessor: (v) => (!isNaN(Date.parse(v)) ? Date.parse(v) : null),
  }),
  fromDate: formatters.where({
    filterType: 'gte',
    valueProcessor: processors.date,
    tableColName: 'publishedAt',
  }),
  toDate: formatters.where({
    filterType: 'lte',
    valueProcessor: processors.date,
    tableColName: 'publishedAt',
  }),
  onlyUnpublished: (obj, key, value) => {
    const filterEnabled = value.length > 0 ? true : false;
    const filter = filterEnabled ? { publishedAt: null } : {};
    obj.where = {
      ...obj.where,
      ...filter,
    };
  },
};

const commentsQueryFormatter = {
  commentId: formatters.where({ tableColName: 'id' }),
  blogId: formatters.where(),
  'blog.title': formatters.whereContains({ caseSensitive: false }),
  ownerId: formatters.where(),
  parentCommentId: formatters.where(),
  author: formatters.whereContains({
    caseSensitive: false,
    tableColName: 'owner.name',
  }),
  text: formatters.whereContains({ caseSensitive: false }),
  fromDate: formatters.where({
    filterType: 'gte',
    valueProcessor: processors.date,
    tableColName: 'createdAt',
  }),
  toDate: formatters.where({
    filterType: 'lte',
    valueProcessor: processors.date,
    tableColName: 'createdAt',
  }),
};

const usersQueryFormatter = {
  userId: formatters.where({ tableColName: 'id' }),
  email: formatters.whereContains({ caseSensitive: false }),
  name: formatters.whereContains({ caseSensitive: false }),
  isAdmin: formatters.where({ valueProcessor: () => true }), // If there is anything at all, true
  isBanned: formatters.where({ valueProcessor: () => true }), // I.e. checkbox = on === true
  fromCreatedDate: formatters.where({
    filterType: 'gte',
    valueProcessor: processors.date,
    tableColName: 'createdAt',
  }),
  toCreatedDate: formatters.where({
    filterType: 'lte',
    valueProcessor: processors.date,
    tableColName: 'createdAt',
  }),
  fromUpdatedDate: formatters.where({
    filterType: 'gte',
    valueProcessor: processors.date,
    tableColName: 'updatedAt',
  }),
  toUpdatedDate: formatters.where({
    filterType: 'lte',
    valueProcessor: processors.date,
    tableColName: 'updatedAt',
  }),
};

const imagesQueryFormatter = {
  imageId: formatters.where({ tableColName: 'id' }),
  ownerId: formatters.where(),
  displayName: formatters.whereContains({ caseSensitive: false }),
  fileName: formatters.whereContains({ caseSensitive: false }),
  altText: formatters.whereContains({ caseSensitive: false }),
  blogId: formatters.where({
    tableColName: 'blogs',
    valueProcessor: (v) => ({ some: { id: v } }),
  }),
  fromCreatedDate: formatters.where({
    filterType: 'gte',
    valueProcessor: processors.date,
    tableColName: 'createdAt',
  }),
  toCreatedDate: formatters.where({
    filterType: 'lte',
    valueProcessor: processors.date,
    tableColName: 'createdAt',
  }),
  fromUpdatedDate: formatters.where({
    filterType: 'gte',
    valueProcessor: processors.date,
    tableColName: 'updatedAt',
  }),
  toUpdatedDate: formatters.where({
    filterType: 'lte',
    valueProcessor: processors.date,
    tableColName: 'updatedAt',
  }),
};

export {
  blogsQueryFormatter,
  commentsQueryFormatter,
  usersQueryFormatter,
  imagesQueryFormatter,
};
