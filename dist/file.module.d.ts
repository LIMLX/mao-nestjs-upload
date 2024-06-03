import { DynamicModule } from '@nestjs/common';
import { FileModuleOptions } from './interface/file.interface';
export declare class FileModule {
    static register(options: FileModuleOptions): DynamicModule;
}
