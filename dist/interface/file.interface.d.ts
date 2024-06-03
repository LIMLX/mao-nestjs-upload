import { TempScrolling } from "../enum/file.enum";
export interface FileModuleOptions {
    path: string;
    delectPath?: string;
    max?: number;
    temp?: boolean;
    tempScrollingConfig?: {
        tempScrolling: TempScrolling;
        interval: number;
    };
}
