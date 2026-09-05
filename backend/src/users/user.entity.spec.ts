import { getMetadataArgsStorage } from 'typeorm';
import { User } from './user.entity.js';

describe('User entity', () => {
  it('declares the persisted account fields', () => {
    const columns = getMetadataArgsStorage().columns
      .filter((column) => column.target === User)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining(['fullName', 'email', 'passwordHash']),
    );
  });

  it('declares email as unique', () => {
    const indices = getMetadataArgsStorage().indices.filter(
      (index) => index.target === User,
    );

    expect(indices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          columns: ['email'],
          unique: true,
        }),
      ]),
    );
  });
});
