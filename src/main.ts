import { BackupManager } from './service/BackupManager';
import { logger } from './logger';

(async function() {
  await new BackupManager().perform();
  logger.info('Done!');
})();
