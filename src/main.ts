import { BackupManager } from './service/BackupManager';
import { logger } from './logger';
import { ENV_CRON, ENV_RUN_AFTER_START } from './env';
import cron from 'node-cron';
import AsyncLock from 'async-lock';

const LOCK_KEY = 'backup';

const lock = new AsyncLock({ timeout: 5000 });
const backupManager = new BackupManager();

lock.acquire(LOCK_KEY, async () => {
  const noBackups = !await backupManager.hasLocalBackups();
  if (ENV_RUN_AFTER_START || noBackups) {
    if(noBackups) {
      logger.info('Detected no local backups, performing initial backup');
    }
    return backupManager.perform();
  }
});

logger.info('Backups will be run using cron schedule %s', ENV_CRON);

cron.schedule(ENV_CRON, () => {
  logger.info('Running scheduled backup...');

  lock.acquire(LOCK_KEY, backupManager.perform, () => {
    logger.warn('Failed to acquire lock, is another backup running?');
  });
});
