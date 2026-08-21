import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260821_170618_add_users_role from './20260821_170618_add_users_role';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260821_170618_add_users_role.up,
    down: migration_20260821_170618_add_users_role.down,
    name: '20260821_170618_add_users_role'
  },
];
