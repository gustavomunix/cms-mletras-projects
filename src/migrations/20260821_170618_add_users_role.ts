import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`header_announcement_messages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`enabled\` integer DEFAULT true,
  	\`kicker\` text,
  	\`metric\` text,
  	\`href\` text,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_announcement\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_announcement_messages_order_idx\` ON \`header_announcement_messages\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_announcement_messages_parent_id_idx\` ON \`header_announcement_messages\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`header_announcement\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`interval_seconds\` numeric DEFAULT 8,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`users\` ADD \`role\` text DEFAULT 'colaborador' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`setor\` text NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`header_announcement_messages\`;`)
  await db.run(sql`DROP TABLE \`header_announcement\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`role\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`setor\`;`)
}
