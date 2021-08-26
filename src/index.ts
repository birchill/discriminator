import * as s from 'superstruct';

type DiscriminatorSchema<
  FieldType extends string,
  MappingType extends Record<string, s.Struct<any, any>>
> = { field: FieldType; mapping: MappingType };

export const discriminator = <
  FieldType extends string,
  MappingType extends Record<string, s.Struct<any, any>>
>(
  field: FieldType,
  mapping: MappingType
) => {
  const keys = Object.keys(mapping);

  const getStructForValue = (
    value: unknown
  ): s.Struct<any, any> | undefined => {
    if (
      !isObject(value) ||
      typeof value[field] !== 'string' ||
      !keys.includes(value[field])
    ) {
      return undefined;
    }

    const branch = value[field];
    const branchStruct = mapping[branch];
    if (!branchStruct) {
      return undefined;
    }

    return extend(branchStruct, s.object({ [field]: s.literal(branch) }));
  };

  return new s.Struct<
    DiscriminatorType<FieldType, MappingType>,
    DiscriminatorSchema<FieldType, MappingType>
  >({
    type: 'discriminator',
    schema: { field, mapping },
    *entries(value: unknown, context: s.Context) {
      const struct = getStructForValue(value);
      if (struct) {
        yield* struct.entries(value, context);
      }
    },
    validator(value: unknown, context: s.Context) {
      if (!isObject(value)) {
        return `Expected an object, but received: ${print(value)}`;
      }

      if (!(field in value) || typeof value[field] !== 'string') {
        return `Expected an object with '${field}' property, but received: ${print(
          value
        )}`;
      }

      if (!keys.includes(value[field])) {
        return `Expected '${field}' to be one of ${keys
          .map((key) => `'${key}'`)
          .join(', ')}, but received: '${value[field]}'`;
      }

      const struct = getStructForValue(value);
      if (!struct) {
        return true;
      }

      return struct.validator(value, context);
    },
  });
};

type ObjectSchema = Record<string, s.Struct<any, any>>;

function extend<
  A extends
    | ObjectSchema
    | DiscriminatorSchema<any, Record<string, s.Struct<any, any>>>,
  B extends ObjectSchema
>(a: s.Struct<any, A>, b: s.Struct<any, B>): s.Struct<any, any> {
  if (a.type === 'discriminator') {
    const discriminatorSchema = a.schema as DiscriminatorSchema<
      any,
      Record<string, s.Struct<any, any>>
    >;
    const mapping: Record<string, s.Struct<any, any>> = {};
    for (const [key, value] of Object.entries(discriminatorSchema.mapping)) {
      mapping[key] = s.assign(value, b);
    }
    return discriminator(a.schema.field, mapping);
  }

  return s.assign(a as s.Struct<any, ObjectSchema>, b);
}

type ConvertToUnion<T> = T[keyof T];

type DiscriminatorInnerType<field extends string, T> = T extends Record<
  string,
  any
>
  ? ConvertToUnion<{ [K in keyof T]: { [P in field]: K } & s.Infer<T[K]> }>
  : never;

type Flatten<T> = T extends object
  ? {
      [P in keyof T]: Flatten<T[P]>;
    }
  : T;

type DiscriminatorType<field extends string, T> = Flatten<
  DiscriminatorInnerType<field, T>
>;

// Taken straight from superstruct
//
// TODO: Improve this so we JSON.stringify objects
function print(value: any): string {
  return typeof value === 'string' ? JSON.stringify(value) : `${value}`;
}

function isObject(a: unknown): a is Record<string, any> {
  return typeof a === 'object' && a !== null && !Array.isArray(a);
}
