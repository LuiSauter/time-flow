import { getMetadataArgsStorage } from 'typeorm';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';
import { WorkSession } from './work-session.entity.js';

describe('WorkSession entity', () => {
  it('declares the auditable journey fields', () => {
    const columns = getMetadataArgsStorage().columns
      .filter((column) => column.target === WorkSession)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining(['origin', 'label', 'startedAt', 'endedAt']),
    );
  });

  it('declares user and project ownership relations', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (relation) => relation.target === WorkSession,
    );

    expect(relations.map((relation) => relation.propertyName)).toEqual(
      expect.arrayContaining(['user', 'project']),
    );
    expect(relations.find((relation) => relation.propertyName === 'user')?.type()).toBe(User);
    expect(relations.find((relation) => relation.propertyName === 'project')?.type()).toBe(Project);
  });

  it('allows an open journey until endedAt is set', () => {
    const endedAt = getMetadataArgsStorage().columns.find(
      (column) => column.target === WorkSession && column.propertyName === 'endedAt',
    );

    expect(endedAt?.options).toMatchObject({
      name: 'ended_at',
      type: 'timestamp with time zone',
      nullable: true,
    });
  });
});
