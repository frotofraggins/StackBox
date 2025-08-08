import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Define the GraphQL schema for your data
 * @see https://docs.amplify.aws/react/build-a-backend/data
 */
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      done: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
