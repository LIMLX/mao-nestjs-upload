/// <reference types="multer" />
import { FileModuleOptions } from './interface/file.interface';
export declare class FileService {
    private options;
    interval: string;
    pathInterval: string;
    delectTemp: string;
    constructor(options: FileModuleOptions);
    bufferUpload(file: Express.Multer.File | Array<Express.Multer.File>, rename: boolean, path?: string): Promise<string | string[]>;
    streamUpload(file: Express.Multer.File, rename: boolean, path?: string): Promise<string>;
    moveTempFile(file: string | string[], movePath: string): Promise<string | string[]>;
    delFile(file: string | string[], path?: string): Promise<string | string[]>;
    delTempFile(): Promise<boolean>;
    getFilePath(file: string): string;
    getFileName(file: string): string;
    private deleteDirectoryContents;
    private tempPath;
    private tempFilePath;
    private tempFileName;
}
