import Client from 'ssh2-sftp-client';
import { ENV_DIRECTORY, ENV_HOST, ENV_PASSWORD, ENV_PORT, ENV_USER } from '../env';
import path from 'path';
import { logger } from '../logger';
import prettyBytes from 'pretty-bytes';

export class SftpService implements BackupStore {

  async connect(): Promise<Client> {
    const client = new Client();
    await client.connect({
      host: ENV_HOST,
      port: ENV_PORT,
      username: ENV_USER,
      password: ENV_PASSWORD,
    });
    return client;
  }

  async list(): Promise<string[]> {
    const client = await this.connect();
    try {
      const list = await client.list(ENV_DIRECTORY);
      return list.map(file => file.name);
    } finally {
      await client.end();
    }
  }

  async download(file: string, destination: string): Promise<void> {
    const client = await this.connect();
    try {
      let previousProgress = 0;
      await client.fastGet(path.join(ENV_DIRECTORY, file), destination, {
        chunkSize: 32768,
        concurrency: 4,
        step: (totalTransferred, _, total) => {
          const progress = Math.round(totalTransferred / total * 100);
          if (previousProgress != progress) {
            logger.info('Downloading backup - %s %s / %s (%s%%)', file, prettyBytes(totalTransferred), prettyBytes(total), progress);
            previousProgress = progress;
          }
        },
      });
    } finally {
      await client.end();
    }
  }

}
