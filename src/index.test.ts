import assert from 'assert';
import * as s from 'superstruct';

import { discriminator } from './';

describe('discriminator', () => {
  it('validates a simple object', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    assert.doesNotThrow(() => s.assert({ kind: 'a', c: 1 }, schema));
    assert.doesNotThrow(() => s.assert({ kind: 'b', d: 'abc' }, schema));
  });

  it('rejects a non-object', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate('test', schema);

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
      'Expected an object, but received: "test"'
    );
  });

  it('rejects an object missing the discriminator field', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate({ c: 3 }, schema);

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
      "Expected an object with 'kind' property, but received: [object Object]"
    );
  });

  it('rejects an object with an unrecognized value for the discriminator field', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate({ kind: 'c', e: 3 }, schema);

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
      "Expected 'kind' to be one of 'a', 'b', but received: 'c'"
    );
  });

  it('rejects an object where the schema for the specified branch does not match', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: s.type({ d: s.string() }),
    });

    const [error] = s.validate({ kind: 'a', c: 'test' }, schema);

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
      'At path: c -- Expected a number, but received: "test"'
    );
  });

  it('validates an empty branch', () => {
    const schema = discriminator('status', {
      success: s.object({}),
      error: s.object({ code: s.string() }),
    });

    assert.doesNotThrow(() => s.assert({ status: 'success' }, schema));
  });

  it('validates an object against a nested schema', () => {
    const schema = discriminator('kind', {
      a: s.object({ c: s.number() }),
      b: discriminator('status', {
        success: s.type({}),
        failure: s.type({ code: s.string() }),
      }),
    });

    assert.doesNotThrow(() => s.assert({ kind: 'a', c: 1 }, schema));
    assert.doesNotThrow(() =>
      s.assert({ kind: 'b', status: 'success' }, schema)
    );
    assert.doesNotThrow(() =>
      s.assert({ kind: 'b', status: 'failure', code: 'error' }, schema)
    );
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

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
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

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
      "Expected an object with 'status' property, but received: [object Object]"
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

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
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

    assert(error instanceof s.StructError);
    assert.strictEqual(
      error.message,
      'At path: code -- Expected a string, but received: 123'
    );
  });
});
