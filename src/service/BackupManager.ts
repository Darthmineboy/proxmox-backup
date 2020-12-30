import { SftpService } from './SftpService';
import { DATA_DIR, FileStore } from './FileStore';
import { Backup } from '../domain/Backup';
import { parseBackupName } from '../util';
import { logger } from '../logger';
import { unitOfTime } from 'moment';
import { ENV_KEEP_DAILY, ENV_KEEP_MONTHLY, ENV_KEEP_WEEKLY, ENV_KEEP_YEARLY, ENV_MAX_DOWNLOADS_EACH_RUN } from '../env';
import path from 'path';
import { existsSync, mkdirSync, promises } from 'fs';
import { emptyDir } from 'fs-extra';

const TEMP_DIR = 'data/temp';

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
} else {
  emptyDir(TEMP_DIR).catch(err => logger.error('Error while emptying temp directory', err));
}

export class BackupManager {
  sftp = new SftpService();
  local = new FileStore();

  async hasLocalBackups(): Promise<boolean> {
    const list = await this.local.list();
    return list.length > 0;
  }

  async perform(): Promise<void> {
    const localFiles = await this.local.list();
    const remoteFiles = await this.sftp.list();

    const backups = this.mergeList(localFiles, remoteFiles);
    const vms = this.getVMs(backups);

    logger.info('Managing backups for %s VMs', vms.length);

    let downloaded = 0;
    let deleted = 0;

    for (const vm of vms) {
      logger.info('Checking backups for VM %s', vm);

      const vmBackups = this.getBackupsForVM(vm, backups);
      this.sortBackupsDescending(vmBackups);
      logger.info('Found %s backups for VM %s', vmBackups.length, vm);

      this.keep(vmBackups, ENV_KEEP_DAILY, 'day');
      this.keep(vmBackups, ENV_KEEP_WEEKLY, 'week');
      this.keep(vmBackups, ENV_KEEP_MONTHLY, 'month');
      this.keep(vmBackups, ENV_KEEP_YEARLY, 'year');

      for (const backup of vmBackups) {
        if (!backup.remote || !backup.keep) {
          continue;
        }
        if (ENV_MAX_DOWNLOADS_EACH_RUN > 0 && downloaded === ENV_MAX_DOWNLOADS_EACH_RUN) {
          logger.info('Reached the download limit of %s backups per run limit for VM %s', ENV_MAX_DOWNLOADS_EACH_RUN,vm)
          break;
        }

        logger.info('Downloading backup %s', backup.name);
        const tempFile = path.join(TEMP_DIR, backup.name);
        await this.sftp.download(backup.name, tempFile);

        const stat = await promises.stat(tempFile);
        const sftpInfo = await this.sftp.info(backup.name);
        if (stat.size === sftpInfo.size) {
          downloaded++;
          await promises.rename(tempFile, path.join(DATA_DIR, backup.name));
        } else {
          logger.warn('Backup size is different, removing backup %s...', backup.name);
          await promises.rm(tempFile);
        }
      }

      for (const backup of vmBackups) {
        if (!backup.remote && !backup.keep) {
          deleted++;
          logger.info('Removing backup %s (not protected by retention)', backup.name);
          await promises.rm(path.join(DATA_DIR, backup.name));
        }
      }
    }

    logger.info('Completed backups. Downloaded %s backups, deleted %s backups', downloaded, deleted);
  }

  keep(backups: Backup[], keep: number, unit: unitOfTime.StartOf): void {
    if (keep <= 0) {
      return;
    }

    const handled = new Set<number>();
    // Latest backup in period, however local backups always have priority over remote backups
    const latestBackupInPeriod: Backup[] = [];

    const ordered = [...backups.filter(b => !b.remote), ...backups.filter(b => b.remote)];
    for (const backup of ordered) {
      const time = backup.endOfPeriod(unit).unix();
      if (!handled.has(time)) {
        logger.debug('Adding %s with time %s %s', backup.name, time, backup.date);
        handled.add(time);
        latestBackupInPeriod.push(backup);
      }
    }

    this.sortBackupsDescending(latestBackupInPeriod);

    for (let i = 0; i < keep; i++) {
      const backup = latestBackupInPeriod[i];
      if (!backup) {
        logger.debug('Not enough backups to satisfy full retention period for (period = %s, number = %s)', unit, i + 1);
        break;
      }

      if (backup.keep) {
        logger.debug('Backup %s will be kept locally (period = %s, number = %s)', backup.name, unit, i + 1);
      } else {
        backup.keep = true;
        if (backup.remote) {
          logger.debug('Backup %s will be downloaded (period = %s, number = %s)', backup.name, unit, i + 1);
        } else {
          logger.debug('Backup %s will be kept locally (period = %s, number = %s)', backup.name, unit, i + 1);
        }
      }
    }
  }

  mergeList(local: string[], remote: string[]): Backup[] {
    const map = new Map<string, boolean>();

    for (const localFile of local) {
      map.set(localFile, false);
    }

    for (const remoteFile of remote) {
      if (!map.has(remoteFile)) {
        // Only add remote file if it is not yet downloaded
        map.set(remoteFile, true);
      }
    }

    const list: Backup[] = [];
    map.forEach((remote, name) => {
      const parsed = parseBackupName(name);
      if (parsed) {
        list.push(new Backup(name, parsed.vm, parsed.date, remote));
      }
    });

    return list;
  }

  /**
   * Get the VMs that are backed up.
   * @param backups
   */
  getVMs(backups: Backup[]): number[] {
    const vms = new Set<number>();
    for (const backup of backups) {
      if (!vms.has(backup.vm)) {
        vms.add(backup.vm);
      }
    }
    return [...vms];
  }

  getBackupsForVM(vm: number, backups: Backup[]): Backup[] {
    return backups.filter(backup => backup.vm === vm);
  }

  sortBackupsDescending(backups: Backup[]) {
    backups.sort((a, b) => {
      return b.date.unix() - a.date.unix();
    });
  }

}
