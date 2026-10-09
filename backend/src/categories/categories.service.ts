import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesRepository } from './categories.repo';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async findAll() {
    let categories = await this.repo.findAll();

    if (categories.length === 0) {
      const defaults = [
        'Backend Development',
        'Frontend Engineering',
        'Full-Stack Architecture',
        'AI & Machine Learning',
      ];
      await this.repo.seedDefaults(defaults);
      categories = await this.repo.findAll();
    }

    return categories;
  }

  async create(dto: CreateCategoryDto) {
    return this.repo.create(dto);
  }
}