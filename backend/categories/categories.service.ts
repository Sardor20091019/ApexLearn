import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DatabaseService } from '../src/database/database.service';

@Injectable()
export class CategoriesService {
  constructor(private database: DatabaseService) {}

  async findAll() {
    let categories = await this.database
      .selectFrom('Category')
      .selectAll()
      .execute();

    if (categories.length === 0) {
      const defaults = [
        { name: 'Backend Development' },
        { name: 'Frontend Engineering' },
        { name: 'Full-Stack Architecture' },
        { name: 'DevOps & Cloud' },
      ];

      for (const cat of defaults) {
        await this.database
          .insertInto('Category')
          .values({ name: cat.name })
          .onConflict((oc) => oc.column('name').doNothing())
          .execute()
          .catch(() => {});
      }

      categories = await this.database
        .selectFrom('Category')
        .selectAll()
        .execute();
    }

    return categories;
  }

  async create(dto: CreateCategoryDto) {
    return this.database
      .insertInto('Category')
      .values({
        name: dto.name,
      })
      .returningAll()
      .executeTakeFirst();
  }
}