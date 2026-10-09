import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db
      .selectFrom('Category')
      .selectAll()
      .execute();
  }

  async seedDefaults(names: string[]) {
    for (const name of names) {
      await this.db
        .insertInto('Category')
        .values({ name })
        .onConflict((oc) => oc.column('name').doNothing())
        .execute()
        .catch(() => {});
    }
  }

  async create(dto: CreateCategoryDto) {
    return this.db
      .insertInto('Category')
      .values({
        name: dto.name,
      })
      .returningAll()
      .executeTakeFirst();
  }
}

