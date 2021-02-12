import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { existsSync } from 'fs-extra';
import { mkdirSync } from 'fs';
import { format } from 'winston';
import { ENV_MAX_LOG_FILES, ENV_MAX_LOG_SIZE } from './constants';

const logDirectory = 'logs';

if (!existsSync(logDirectory)) {
    mkdirSync(logDirectory);
}

const transport = new winston.transports.DailyRotateFile({
    dirname: logDirectory,
    filename: '%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    level: 'debug',
    maxSize: (process.env[ENV_MAX_LOG_SIZE] || 10) + 'm',
    maxFiles: (process.env[ENV_MAX_LOG_FILES] || 365) + 'd',
});

export const logger = winston.createLogger({
    format: format.combine(
        format.splat(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf(
            (info) =>
                `${info.timestamp} ${info.level}: ${info.message}` +
                (info.splat !== undefined ? `${info.splat}` : ' '),
        ),
    ),
    transports: [
        transport,
        new winston.transports.Console({
            format: format.combine(
                format.splat(),
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                format.colorize(),
                format.printf(
                    (info) =>
                        `${info.timestamp} ${info.level}: ${info.message}` +
                        (info.splat !== undefined ? `${info.splat}` : ' '),
                ),
            ),
        }),
    ],
});
