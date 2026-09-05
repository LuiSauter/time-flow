import { getMetadataArgsStorage } from 'typeorm';
import { TrackerSegment } from './tracker-segment.entity.js';
import { WorkSession } from './work-session.entity.js';

describe('TrackerSegment entity', () => {
  it('declares the auditable segment fields', () => {
    const columns = getMetadataArgsStorage().columns
      .filter((column) => column.target === TrackerSegment)
      .map((column) => column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining(['kind', 'label', 'startedAt', 'endedAt']),
    );
  });

  it('belongs to a work session and allows an open end', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (item) => item.target === TrackerSegment && item.propertyName === 'workSession',
    );
    const endedAt = getMetadataArgsStorage().columns.find(
      (column) => column.target === TrackerSegment && column.propertyName === 'endedAt',
    );

    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.type()).toBe(WorkSession);
    expect(endedAt?.options).toMatchObject({
      name: 'ended_at',
      type: 'timestamp with time zone',
      nullable: true,
    });
  });
});
