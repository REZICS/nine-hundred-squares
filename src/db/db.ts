import Dexie, {Table} from 'dexie';

export interface User {
  id?: number; // 自增主键
  name: string;
  birthday: Date;
  current: 0 | 1; // 是否为当前身份
}

class AppDatabase extends Dexie {
  users!: Table<User, number>;

  constructor() {
    super('AppDatabase');

    this.version(1).stores({
      // ++id = 自增主键
      // current 加索引，方便查当前用户
      users: '++id, name, birthday, current',
    });
  }
}

export const db = new AppDatabase();
