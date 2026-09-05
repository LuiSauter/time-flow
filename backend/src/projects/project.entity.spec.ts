import { getMetadataArgsStorage } from 'typeorm';
import { Project } from './project.entity.js';
import { User } from '../users/user.entity.js';

describe('Project entity', () => {
  it('declares the persisted project fields', () => {
    const columns = getMetadataArgsStorage().columns
      .filter((column) => column.target === Project)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining(['name', 'timeZone', 'dailyGoalMinutes']),
    );
  });

  it('uses eight hours as the default daily goal', () => {
    const goalColumn = getMetadataArgsStorage().columns.find(
      (column) => column.target === Project && column.propertyName === 'dailyGoalMinutes',
    );

    expect(goalColumn?.options).toMatchObject({
      name: 'daily_goal_minutes',
      type: 'integer',
      default: 480,
    });
  });

  it('declares the owning user relation', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (item) => item.target === Project && item.propertyName === 'user',
    );

    expect(relation?.relationType).toBe('many-to-one');
    expect(typeof relation?.type).toBe('function');
    expect(relation?.type()).toBe(User);
  });
});
