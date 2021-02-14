import Client, { FileInfo } from 'ssh2-sftp-client';
import {
    ENV_DIRECTORY,
    ENV_SFTP_HOST,
    ENV_SFTP_PASSWORD,
    ENV_SFTP_PORT,
    ENV_SFTP_USER,
} from '../env';
import path from 'path';

export class SftpService implements BackupStore {
    async connect(): Promise<Client> {
        const client = new Client();
        await client.connect({
            host: ENV_SFTP_HOST,
            port: ENV_SFTP_PORT,
            username: ENV_SFTP_USER,
            password: ENV_SFTP_PASSWORD,
            keepaliveInterval: 30000,
            keepaliveCountMax: 5,
        });
        return client;
    }

    async list(): Promise<string[]> {
        const client = await this.connect();
        try {
            const list = await client.list(ENV_DIRECTORY);
            return list.map((file) => file.name);
        } finally {
            await client.end();
        }
    }

    async download(file: string, destination: string): Promise<void> {
        const client = await this.connect();
        try {
            await client.get(path.join(ENV_DIRECTORY, file), destination);
            /* let previousProgress = 0;
            await client.fastGet(path.join(ENV_DIRECTORY, file), destination, {
                //chunkSize: 32768,
                concurrency: ENV_SFTP_CONCURRENCY,
                step: (totalTransferred, _, total) => {
                    const progress = Math.round(
                        (totalTransferred / total) * 100,
                    );
                    if (previousProgress != progress) {
                        logger.info(
                            'Downloading backup %s - %s / %s (%s%%)',
                            file,
                            prettyBytes(totalTransferred),
                            prettyBytes(total),
                            progress,
                        );
                        previousProgress = progress;
                    }
                },
            });*/
        } finally {
            await client.end();
        }
    }

    async info(file: string): Promise<FileInfo> {
        const client = await this.connect();
        try {
            const list = await client.list(ENV_DIRECTORY);
            return list.find((e) => e.name === file);
        } finally {
            await client.end();
        }
    }
}
