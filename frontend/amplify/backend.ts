import { defineBackend } from '@aws-amplify/backend';
import { defineAuth } from '@aws-amplify/backend';
import { defineData } from '@aws-amplify/backend';

const auth = defineAuth({
  loginWith: {
    email: true,
  },
});

const data = defineData({
  schema: /* GraphQL */ `
    type Todo @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      content: String!
      done: Boolean!
    }
  `,
});

export const backend = defineBackend({
  auth,
  data
});
