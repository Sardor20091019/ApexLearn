"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_ctl_1 = require("kysely-ctl");
const kysely_1 = require("kysely");
const pg_1 = require("pg");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();
exports.default = (0, kysely_ctl_1.defineConfig)({
    dialect: new kysely_1.PostgresDialect({
        pool: new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        }),
    }),
    migrations: {
        migrationFolder: path.resolve(__dirname, 'backend/src/database/migrations'),
    },
});
//# sourceMappingURL=kysely.config.js.map