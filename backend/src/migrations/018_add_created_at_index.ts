import type { Migration } from "../utils/migration-runner";

export const migration: Migration = {
	name: "018_add_created_at_index",
	up(db) {
		db.exec(
			"CREATE INDEX IF NOT EXISTS idx_whiskeys_created_at ON whiskeys(created_at)",
		);
	},
};
