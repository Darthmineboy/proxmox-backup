import liquibase from 'liquibase';
import { readFileSync } from 'fs';
import { logger } from './logger';

export async function runDatabaseMigration() {
  const config = {
    classpath: 'node_modules/liquibase/lib/Drivers/mariadb-java-client-2.5.3.jar',
    changeLogFile: 'migrations/changelog-master.xml',
    url: `"jdbc:mariadb://${process.env.APP_DB_HOST}:${process.env.APP_DB_PORT}/${process.env.APP_DB_NAME}"`,
    username: process.env.APP_DB_USER,
    password: process.env.APP_DB_PASSWORD,
    logLevel: 'debug',
    overwriteOutputFile: 'true',
    logFile: 'liquibase.log'
  };
  try {
    return await liquibase(config).run();
  }catch (e) {
    const content = readFileSync('liquibase.log');
    logger.error(content);
    throw e;
  }
}
