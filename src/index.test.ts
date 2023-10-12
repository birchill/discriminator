import * as s from 'superstruct';
import { describe, expect, it } from 'vitest';

import { discriminator } from './';

describe('discriminator', () => {
  it('validates a simple object', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    expect(() => s.assert({ kind: 'a', c: 1 }, schema)).not.toThrow();
    expect(() => s.assert({ kind: 'b', d: 'abc' }, schema)).not.toThrow();
  });

  it('rejects a non-object', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate('test', schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      'Expected an object, but received: "test"'
    );
  });

  it('rejects an object missing the discriminator field', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate({ c: 3 }, schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      'Expected an object with \'kind\' property, but received: {"c":3}'
    );
  });

  it('rejects an object with an unrecognized value for the discriminator field', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate({ kind: 'c', e: 3 }, schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      "Expected 'kind' to be one of 'a', 'b', but received: 'c'"
    );
  });

  it('rejects an object where the schema for the specified branch does not match', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate({ kind: 'a', c: 'test' }, schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      'At path: c -- Expected a number, but received: "test"'
    );
  });

  it('validates an empty branch', () => {
    const schema = discriminator('status', {
      success: s.object({}),
      error: s.object({ code: s.string() }),
    });

    expect(() => s.assert({ status: 'success' }, schema)).not.toThrow();
  });

  it('validates an object against a nested schema', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: discriminator('status', {
        success: s.type({}),
        failure: s.type({ code: s.string() }),
      }),
    });

    expect(() => s.assert({ kind: 'a', c: 1 }, schema)).not.toThrow();
    expect(() =>
      s.assert({ kind: 'b', status: 'success' }, schema)
    ).not.toThrow();
    expect(() =>
      s.assert({ kind: 'b', status: 'failure', code: 'error' }, schema)
    ).not.toThrow();
  });

  it('rejects a non-object using a nested schema', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: discriminator('status', {
        success: s.type({}),
        failure: s.type({ code: s.string() }),
      }),
    });

    const [error] = s.validate('test', schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      'Expected an object, but received: "test"'
    );
  });

  it('rejects an object missing the nested discriminator from a nested schema', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: discriminator('status', {
        success: s.type({}),
        failure: s.type({ code: s.string() }),
      }),
    });

    const [error] = s.validate({ kind: 'b', code: 'error' }, schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      'Expected an object with \'status\' property, but received: {"kind":"b","code":"error"}'
    );
  });

  it('rejects an object with an unrecognized value for the nested discriminator field from a nested schema', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: discriminator('status', {
        success: s.type({}),
        failure: s.type({ code: s.string() }),
      }),
    });

    const [error] = s.validate({ kind: 'b', status: 'unknown' }, schema);

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      "Expected 'status' to be one of 'success', 'failure', but received: 'unknown'"
    );
  });

  it('rejects an object where the schema for the specified branch does not match using a nested schema', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: discriminator('status', {
        success: s.type({}),
        failure: s.type({ code: s.string() }),
      }),
    });

    const [error] = s.validate(
      { kind: 'b', status: 'failure', code: 123 },
      schema
    );

    expect(error).toBeInstanceOf(s.StructError);
    expect((error as s.StructError).message).toBe(
      'At path: code -- Expected a string, but received: 123'
    );
  });
});
