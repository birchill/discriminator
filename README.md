# discriminator

A tagged union type for [superstruct](https://docs.superstructjs.org/) based on
[JSON typedef's
discriminator](https://jsontypedef.com/docs/jtd-in-5-minutes/#discriminator-schemas)
type.

```typescript
import { boolean, Infer, enums, string, object } from 'superstruct';
import { discriminator } from '@birchill/discriminator';

const schema = discriminator('eventType', {
  USER_CREATED: object({ id: string() }),
  USER_PAYMENT_PLAN_CHANGED: object({
    id: string(),
    plan: enums(['FREE', 'PAID']),
  }),
  USER_DELETED: object({ id: string(), softDelete: boolean() }),
});

type SchemaType = Infer<typeof schema>;

// SchemaType =
// {
//   eventType: "USER_CREATED";
//   id: string;
// } | {
//   eventType: "USER_PAYMENT_PLAN_CHANGED";
//   id: string;
//   plan: "FREE" | "PAID";
// } | {
//   eventType: "USER_DELETED";
//   id: string;
//   softDelete: boolean;
// }
```

## Why?

- If you try to model the above using `union()` objects and validation fails you
  get errors like:

  ` Expected the value to satisfy a union of ``object | object | object``, but received: [object Object]`.

  Using `discriminator()` you get errors like:

  `At path: value.name -- Expected a string with a length between ``0``and ``256`` but received one with a length of ``257`` `.

- Better semantics.
- Easier translation to and from [JSON typedef](https://jsontypedef.com/) should
  that be useful.

## Specifics

`discriminator()` takes two parameters:

1. A string representing the tagged union's tag field.
2. An object where the keys are the tag values and the values are `object()`,
   `type()`, or `discriminator()` structs.

If you need to model a branch where there are no other properties just use an
empty `object()` or `type()`.
This is important because you're indicating whether or not that branch is
allowed to have extra values on it (`type()`) or not (`object()`).

e.g.

```typescript
discriminator('action', {
  signin: type({ email: string(), token: string() }),
  signout: type(),
});
```

You can nest `discriminator()` objects like so:

```typescript
discriminator('result', {
  success: discriminator('task', {
    upload: type({
      filename: string(),
    }),
    download: type({
      filename: string(),
      bytes: number(),
    }),
  }),
  failure: type({
    code: number(),
  }),
});

// `Infer` here produces the type:
//
// {
//   result: "success";
//   task: "upload";
//   filename: string;
// } | {
//   result: "success";
//   task: "download";
//   filename: string;
//   bytes: number;
// } | {
//   result: "failure";
//   code: number;
// }
```

## Developing

### Building

```
pnpm build
```

### Testing

```
pnpm test
```

### Releasing

```
pnpm release-it
```
