import Mysql from './db/mysql';
import Schema from './db/schema';
import Table from './db/table';
import UserTable from './db/user-table';
import VersionTable from './db/version-table';
import { CommonVoiceConfig } from '../../config-helper';

export type Tables = Table[];

export default class DB {
  config: CommonVoiceConfig;
  mysql: Mysql;
  schema: Schema;
  tables: Tables;
  user: UserTable;
  version: VersionTable;

  constructor(config: CommonVoiceConfig) {
    this.config = config;
    this.mysql = new Mysql(this.config);
    this.user = new UserTable(this.mysql);
    this.version = new VersionTable(this.mysql);

    this.tables = [];
    this.tables.push(this.user as Table);
    this.tables.push(this.version as Table);

    this.schema = new Schema(this.mysql, this.tables, this.version);
  }

  /**
   * Ensure we can connect to database at least as root.
   */
  async ensureConnection(): Promise<void> {
    return this.mysql.ensureConnection(true);
  }

  /**
   * Ensure the database is setup.
   */
  async ensureSetup(): Promise<void> {
    return this.schema.ensure();
  }

  /**
   * Make sure we have a fully updated schema.
   */
  async ensureLatest(): Promise<void> {
    await this.ensureSetup();
    let version;

    try {
      version = await this.version.getCurrentVersion();
    } catch (err) {
      console.error('error fetching version', err);
      version = 0;
    }

    await this.schema.upgrade(version);
  }

  /**
   * End connection to the database.
   */
  endConnection(): void {
    this.mysql.endConnection();
  }
}
