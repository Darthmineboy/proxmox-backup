export const ENV_CRON = process.env.CRON ?? '0 0 * * *';

export const ENV_SFTP_HOST = process.env.SFTP_HOST;
export const ENV_SFTP_PORT: number = +process.env.SFTP_PORT ?? 22;
export const ENV_SFTP_USER = process.env.SFTP_USER ?? 'root';
export const ENV_SFTP_PASSWORD = process.env.SFTP_PASSWORD;
export const ENV_SFTP_CONCURRENCY: number = +process.env.SFTP_CONCURRENCY ?? 1;

export const ENV_RUN_AFTER_START = process.env.RUN_AFTER_START !== 'false';

/**
 * Maximum number of backups that will be downloaded each run per VM.
 * This can be used to gradually built up the amount of retained backups when introducing this backup app.
 */
export const ENV_MAX_DOWNLOADS_EACH_RUN: number = +process.env.MAX_DOWNLOADS_EACH_RUN || 2;
export const ENV_DIRECTORY = process.env.DIRECTORY ?? '/var/lib/vz/dump';
export const ENV_FILE_NAME = process.env.FILE_NAME ?? 'vzdump-qemu-(?<vm>\\d+)-(?<year>\\d+)_(?<month>\\d+)_(?<day>\\d+)-(?<hour>\\d+)_(?<minute>\\d+)_(?<second>\\d+).vma.+';

export const ENV_KEEP_DAILY: number = +process.env.KEEP_DAILY ?? 0;
export const ENV_KEEP_WEEKLY: number = +process.env.KEEP_WEEKLY ?? 0;
export const ENV_KEEP_MONTHLY: number = +process.env.KEEP_MONTHLY ?? 0;
export const ENV_KEEP_YEARLY: number = +process.env.KEEP_YEARLY ?? 0;
