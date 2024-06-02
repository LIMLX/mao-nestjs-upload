import { DynamicModule, Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileModuleOptions } from './interface/file.interface';

@Module({})
export class FileModule {
    static register(options: FileModuleOptions): DynamicModule {
        return {
            module: FileModule,
            providers: [
                {
                    provide: 'FILE_OPTIONS',
                    useValue: options,
                },
                FileService,
            ],
            exports: [FileService],
        };
    }
}