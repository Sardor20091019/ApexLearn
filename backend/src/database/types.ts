import { Generated } from 'kysely';

export type Role = 'USER' | 'INSTRUCTOR' | 'ADMIN';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type UploadType = 'VIDEO' | 'IMAGE' | 'DOCUMENT';
export type PricingType = 'FREE' | 'PAID';

export interface UserTable {
  id: Generated<string>;
  email: string;
  password: string;
  name: string;
  role: Generated<Role>;
  avatarUrl: string | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface RefreshTokenTable {
  id: Generated<string>;
  userId: string;
  tokenHash: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface CategoryTable {
  id: Generated<string>;
  name: string;
  imageUrl: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface CourseTable {
  id: Generated<string>;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  status: Generated<CourseStatus>;
  pricingType: Generated<PricingType>;
  price: string | null;
  imageUrl: string | null;
  language: string | null;
  currency: Generated<string>;
  authorId: string;
  categoryId: string | null;
  enrollmentCount: Generated<number>;
  ratingAverage: Generated<number>;
  ratingCount: Generated<number>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  level: string | null;
}

export interface SectionTable {
  id: Generated<string>;
  title: string;
  order: Generated<number>;
  courseId: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface LessonTable {
  id: Generated<string>;
  title: string;
  videoUrl: string | null;
  subtitleUrl: string | null;
  content: string | null;
  freePreview: Generated<boolean>;
  order: Generated<number>;
  sectionId: string;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface EnrollmentTable {
  id: Generated<string>;
  userId: string;
  courseId: string;
  pricePaid: string | null;
  createdAt: Generated<Date>;
}

export interface ReviewTable {
  id: Generated<string>;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface StarTable {
  id: Generated<string>;
  userId: string;
  courseId: string;
  createdAt: Generated<Date>;
}

export interface CommentTable {
  id: Generated<string>;
  userId: string;
  lessonId: string;
  body: string;
  createdAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface ProgressTable {
  id: Generated<string>;
  userId: string;
  lessonId: string;
  completed: Generated<boolean>;
  completedAt: Generated<Date>;
}

export interface UploadTable {
  id: Generated<string>;
  userId: string;
  key: string;
  bucket: string;
  type: UploadType;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Generated<Date>;
}

export interface NotificationTable {
  id: Generated<string>;
  userId: string;
  title: string;
  body: string;
  isRead: Generated<boolean>;
  createdAt: Generated<Date>;
}

export interface ConversationTable {
  id: Generated<string>;
  userId: string;
  adminId: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface MessageTable {
  id: Generated<string>;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Generated<Date>;
}

export interface PaymentTable {
  id: Generated<string>;
  userId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  amount: string;
  currency: Generated<string>;
  status: Generated<string>;
  courseIds: string;
  createdAt: Generated<Date>;
}

export interface DB {
  User: UserTable;
  RefreshToken: RefreshTokenTable;
  Category: CategoryTable;
  Course: CourseTable;
  Section: SectionTable;
  Lesson: LessonTable;
  Enrollment: EnrollmentTable;
  Review: ReviewTable;
  Star: StarTable;
  Comment: CommentTable;
  Progress: ProgressTable;
  Upload: UploadTable;
  Notification: NotificationTable;
  Conversation: ConversationTable;
  Message: MessageTable;
  Payment: PaymentTable;
}