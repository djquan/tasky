import type { Heading } from '@tasky/shared';
import type { Command } from '../../undo';
import { headingsMap } from '../../yjs';
import { now } from '@tasky/shared';

export class CreateHeadingCommand implements Command {
  private heading: Heading;

  constructor(heading: Heading) {
    this.heading = { ...heading };
  }

  execute(): void {
    headingsMap.set(this.heading.id, this.heading);
  }

  undo(): void {
    headingsMap.delete(this.heading.id);
  }
}

export class UpdateHeadingCommand implements Command {
  private headingId: string;
  private oldHeading: Heading;
  private newHeading: Heading;

  constructor(oldHeading: Heading, updates: Partial<Heading>) {
    this.headingId = oldHeading.id;
    this.oldHeading = { ...oldHeading };
    this.newHeading = {
      ...oldHeading,
      ...updates,
      updatedAt: now()
    };
  }

  execute(): void {
    headingsMap.set(this.headingId, this.newHeading);
  }

  undo(): void {
    headingsMap.set(this.headingId, this.oldHeading);
  }
}

export class DeleteHeadingCommand implements Command {
  private heading: Heading;

  constructor(heading: Heading) {
    this.heading = { ...heading };
  }

  execute(): void {
    headingsMap.delete(this.heading.id);
  }

  undo(): void {
    headingsMap.set(this.heading.id, this.heading);
  }
}

export class ArchiveHeadingCommand implements Command {
  private headingId: string;
  private oldArchived: boolean;

  constructor(heading: Heading) {
    this.headingId = heading.id;
    this.oldArchived = heading.archived;
  }

  execute(): void {
    const heading = headingsMap.get(this.headingId);
    if (!heading) return;

    const updated: Heading = {
      ...heading,
      archived: true,
      updatedAt: now()
    };
    headingsMap.set(this.headingId, updated);
  }

  undo(): void {
    const heading = headingsMap.get(this.headingId);
    if (!heading) return;

    const updated: Heading = {
      ...heading,
      archived: this.oldArchived,
      updatedAt: now()
    };
    headingsMap.set(this.headingId, updated);
  }
}

