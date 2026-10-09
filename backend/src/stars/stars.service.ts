import { Injectable } from '@nestjs/common';
import { StarsRepository } from './stars.repo';

@Injectable()
export class StarsService {
  constructor(private readonly repo: StarsRepository) {}

  async getUserStars(userId: string): Promise<string[]> {
    const stars = await this.repo.findUserStars(userId);
    return stars.map((s) => s.courseId);
  }

  async toggleStar(userId: string, courseId: string): Promise<{ isStarred: boolean; courseId: string }> {
    const existing = await this.repo.findStar(userId, courseId);

    if (existing) {
      await this.repo.deleteStar(userId, courseId);
      return { isStarred: false, courseId };
    }

    await this.repo.createStar(userId, courseId);
    return { isStarred: true, courseId };
  }
}
