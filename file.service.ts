import { Injectable, Inject } from '@nestjs/common';
import { FileModuleOptions } from './interface/file.interface';
import * as fs from 'fs'
import { v4 } from 'uuid'
import { promises } from 'fs';
import { TempScrolling } from './enum/file.enum'
import { join } from 'path';

@Injectable()
export class FileService {
    interval = "@";
    pathInterval = "_";
    delectTemp = "delect";

    constructor(@Inject('FILE_OPTIONS') private options: FileModuleOptions) {
        // 判断目录是否存在
        if (!fs.existsSync(options.path)) {
            fs.mkdirSync(options.path);
        }
        // 检查是否有启动temp，且如果启动了但没有赋值tempScrollingConfig则赋值默认值
        if (options.temp && !options.tempScrollingConfig) {
            // 设置为以天为单位，最大间隔7天的文件夹进行删除
            options.tempScrollingConfig = { tempScrolling: TempScrolling.DAY, interval: 7 };
        }
        // 检查是否填写delectPath,没有则填写默认值
        if (!options.delectPath) {
            options.delectPath = this.delectTemp;
        }
    }

    // buffer文件上传
    async bufferUpload(file: Express.Multer.File | Array<Express.Multer.File>, rename: boolean, path?: string): Promise<string | string[]> {
        if (!file) {
            return "";
        }
        // 获取前缀
        let tempPath = this.options.temp ? this.tempPath() : "";
        // 获取文件夹名
        let _path = this.options.temp ? `${this.options.path}/${tempPath}` : this.options.path;
        // 检测暂存文件夹是否存在
        if (this.options.temp && !fs.existsSync(`${_path}`)) {
            fs.mkdirSync(`${_path}`);
        }
        // 检测文件夹是否存在
        if (path && !fs.existsSync(`${_path}/${path}`)) {
            let __path = "";
            path.split("/").forEach(data => {
                __path += data;
                if (path && !fs.existsSync(`${_path}/${__path}`)) {
                    fs.mkdirSync(`${_path}/${__path}`);
                }
                __path += "/";
            })
        }
        // 进行暂存文件名拼接
        // 当有目录且开启暂存文件夹时 || 当有目录但没有开启暂存文件夹时
        if (path && this.options.temp || path && !this.options.temp) {
            tempPath += this.interval + path.replace("/", "-") + this.pathInterval;
        }
        // 当没有目录但开启了暂存文件夹时
        else if (!path && this.options.temp) {
            tempPath += this.interval;
        }
        if (Array.isArray(file)) {
            // 判断文件大小是否合理并且创建uuid名
            for (let i = 0; i < file.length; i++) {
                // 检查大小值
                if (file[i].size > this.options.max) {
                    // 输出超出限制抛入异常或返回值
                    console.error("error: 文件上传大小超过限制");
                    return;
                }
                // 文件重命名
                // 检查是否需要开启重命名
                file[i].originalname = rename ? `${tempPath}${v4()}${file[i].originalname.match(/\.([^.]+)$/)[0]}` : tempPath + file[i].originalname;
            }
            // 并发执行文件上传
            try {
                await Promise.all(file.map(data => { return promises.writeFile(path ? `${_path}/${path}/${data.originalname}` : `${_path}/${data.originalname}`, data.buffer) }));
                return file.map(data => {
                    return data.originalname;
                })
            } catch (error) {
                throw new Error(error);
            }
        } else {
            // 限制文件大小
            if (this.options.max && this.options.max < file.size) {
                // 输出超出限制抛入异常或返回值
                console.error("error: 文件上传大小超过限制");
                return;
            }
            // 截取文件名后缀用uuid
            const originalname = rename ? `${tempPath}${v4()}${file.originalname.match(/\.([^.]+)$/)[0]}` : tempPath + file.originalname;
            // 单文件上传
            try {
                await fs.promises.writeFile(path ? `${_path}/${path}/${originalname}` : `${_path}/${originalname}`, file.buffer);
                return originalname;
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    // 流式文件上传
    async streamUpload(file: Express.Multer.File, rename: boolean, path?: string): Promise<string> {
        if (!file.path) {
            return "";
        }
        // 获取前缀
        let tempPath = this.options.temp ? this.tempPath() : "";
        // 获取文件夹名
        let _path = this.options.temp ? `${this.options.path}/${tempPath}` : this.options.path;
        // 检测暂存文件夹是否存在
        if (this.options.temp && !fs.existsSync(`${_path}`)) {
            fs.mkdirSync(`${_path}`);
        }
        // 检测文件夹是否存在
        if (path && !fs.existsSync(`${_path}/${path}`)) {
            let __path = "";
            path.split("/").forEach(data => {
                __path += data;
                if (path && !fs.existsSync(`${_path}/${__path}`)) {
                    fs.mkdirSync(`${_path}/${__path}`);
                }
                __path += "/";
            })
        }
        // 进行暂存文件名拼接
        // 当有目录且开启暂存文件夹时 || 当有目录但没有开启暂存文件夹时
        if (path && this.options.temp || path && !this.options.temp) {
            tempPath += this.interval + path.replace("/", "-") + this.pathInterval;
        }
        // 当没有目录但开启了暂存文件夹时
        else if (!path && this.options.temp) {
            tempPath += this.interval;
        }
        // 截取文件名后缀用uuid
        const originalname = rename ? `${tempPath}${v4()}${file.originalname.match(/\.([^.]+)$/)[0]}` : tempPath + file.originalname;
        try {
            // 创建流文件
            const writeStream = fs.createWriteStream(path ? `${_path}/${path}/${originalname}` : `${_path}/${originalname}`);
            // 读取暂存区的流
            const readStream = fs.createReadStream(file.path);
            // 将读取的文件流写入到目标文件中
            readStream.pipe(writeStream);
            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => resolve(originalname));
                writeStream.on('error', () => reject());
            });
        } catch (error) {
            throw new Error(error);
        }
    }

    // 文件移动
    async moveTempFile(file: string | string[], movePath: string): Promise<string | string[]> {
        if (!file) {
            return "";
        }
        // 创建移动文件目录
        if (!fs.existsSync(`${this.options.path}/${movePath}`)) {
            let _path = "";
            movePath.split("/").forEach(data => {
                _path += data;
                if (!fs.existsSync(`${this.options.path}/${_path}`)) {
                    fs.mkdirSync(`${this.options.path}/${_path}`);
                }
                _path += "/";
            })
        }
        // 拼接移动文件夹目录
        const _movePath = `${this.options.path}/${movePath}`;
        const tempPath = this.interval + movePath.replace("/", "-") + this.pathInterval;
        if (Array.isArray(file)) {
            try {
                // 存储文件名
                let fileNames = [];
                // 移动
                await Promise.all(file.map(data => { const fileName = tempPath + this.tempFileName(data); fileNames.push(fileName); return promises.rename(`${this.tempFilePath(data)}/${data}`, `${_movePath}/${fileName}`) }));
                return fileNames;
            } catch (error) {
                throw new Error(error);
            }
        } else {
            // 开始移动文件
            // 拼接被移动文件路径
            const filePath = `${this.tempFilePath(file)}/${file}`;
            try {
                await fs.promises.rename(filePath, `${_movePath}/${tempPath}${this.tempFileName(file)}`);
                return tempPath + this.tempFileName(file);
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    // 文件删除暂存区(删除文件名 + 选择路径--如果是非暂存区需要指定路径)
    async delFile(file: string | string[], path?: string): Promise<string | string[]> {
        if (!file) {
            return "";
        }
        // 获取删除文件夹前缀
        let tempPath = this.options.temp ? this.tempPath() + `${this.options.delectPath}` : "";
        // 获取删除文件夹名
        let _path = this.options.temp ? `${this.options.path}/${tempPath}` : this.options.path + `/${this.options.delectPath}`;
        // 检测删除根目录暂存文件夹是否存在
        if (!fs.existsSync(`${_path}`)) {
            fs.mkdirSync(`${_path}`);
        }

        // 创建自定义删除文件目录
        if (path && !fs.existsSync(`${_path}/${path}`)) {
            let __path = "";
            path.split("/").forEach(data => {
                __path += data;
                if (!fs.existsSync(`${_path}/${__path}`)) {
                    fs.mkdirSync(`${_path}/${__path}`);
                }
                __path += "/";
            })
        }
        // 文件名
        const tempName = path ? this.interval + path.replace("/", "-") + this.pathInterval : this.interval;
        // 开始移动被删除文件
        // 确认文件目录
        if (Array.isArray(file)) {
            try {
                let fileNames = [];
                // 移动
                await Promise.all(file.map(async data => {
                    const fileName = this.options.temp ? `${tempPath}${tempName}${this.tempFileName(data)}` : `${this.options.delectPath}${tempName}${this.tempFileName(data)}`;
                    fileNames.push(fileName);
                    return promises.rename(`${this.tempFilePath(data)}/${data}`, path ? `${_path}/${path}/${fileName}` : `${_path}/${fileName}`);
                }));
                return fileNames;
            } catch (error) {
                console.error(error);
            }
        }
        else {
            // 开始移动文件
            // 接被移动文件路径
            const filePath = `${this.tempFilePath(file)}/${file}`;
            const fileName = this.options.temp ? `${tempPath}${tempName}${this.tempFileName(file)}` : `${this.options.delectPath}${tempName}${this.tempFileName(file)}`;

            try {
                await fs.promises.rename(filePath, path ? `${_path}/${path}/${fileName}` : `${_path}/${fileName}`);
                return fileName;
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    // 暂存区超时文件夹删除
    async delTempFile(): Promise<boolean> {
        // 获取目录下的文件夹
        const directoryContents = await fs.promises.readdir(this.options.path, { withFileTypes: true });
        // 提出文件夹部分
        const directories = directoryContents.filter(item => item.isDirectory()).map(item => item.name);
        // 检查是否开启暂存区
        if (!this.options.temp) {
            // 当没开启时，清除delect文件夹中删除文件夹
            // 判断是否存在暂存文件夹目录
            if (!directories.includes(this.options.delectPath)) {
                return true;
            }
            // 打开删除暂存区文件夹，获取其中的文件及文件夹
            return await this.deleteDirectoryContents(this.options.path + `/${this.options.delectPath}`).then(() => {
                console.log("删除成功");
                return true;
            }).catch(() => {
                console.error("删除失败");
                return false;
            });
        }
        // 当开启了，则寻找符合条件的文件夹
        // 判断需要寻找的前缀
        let tempPath: RegExp = undefined;
        switch (this.options.tempScrollingConfig.tempScrolling) {
            case TempScrolling.YEAR: tempPath = /^\d{4}/; break;
            case TempScrolling.MONTH: tempPath = /^\d{4}-(1[0-2]|0?[1-9])/; break;
            case TempScrolling.DAY: tempPath = /^\d{4}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])/; break;
            default: return false;
        }
        // 提取满足条件的文件
        let directorys = [];
        directories.forEach(directory => {
            // 查看文件名是否满足条件
            if (tempPath.test(directory)) {
                // 查看文件名的是否在指定范围
                // 获取指定范围的时间前缀
                const temp = tempPath.exec(directory)[0];
                let today = new Date();
                switch (temp.split("-").length) {
                    // 当为年时
                    case 1: parseInt(temp) <= new Date().getFullYear() - this.options.tempScrollingConfig.interval ? directorys.push(directory) : null;
                    // 当为月时
                    case 2: new Date(temp) <= new Date(today.getFullYear(), today.getMonth() - this.options.tempScrollingConfig.interval, 2) ? directorys.push(directory) : null;
                    // 当为日时
                    case 3: new Date(temp) <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1 - this.options.tempScrollingConfig.interval, -16) ? directorys.push(directory) : null;
                }
            }
        })
        // 进行文件删除
        for (let i = 0; i < directorys.length; i++) {
            await this.deleteDirectoryContents(this.options.path + `/${directorys[i]}`).then(() => {
                console.log("删除成功");
                // 删除完成后删除掉主目录文件
                fs.promises.rmdir(this.options.path + `/${directorys[i]}`);
                return true;
            }).catch(() => {
                console.error("删除失败");
                return false;
            });
        }
    }

    // 解析上传文件的地址
    getFilePath(file: string) {
        if (!file) {
            return "";
        }
        return `${this.tempFilePath(file)}/${file}`;
    }

    // 截取文件原名
    getFileName(file: string) {
        if (!file) {
            return "";
        }
        return this.tempFileName(file);
    }

    // 递归删除文件操作
    private async deleteDirectoryContents(directoryPath: string) {
        try {
            const directoryContents = await fs.promises.readdir(directoryPath, { withFileTypes: true });

            for (const item of directoryContents) {
                const itemPath = join(directoryPath, item.name);

                if (item.isDirectory()) {
                    await this.deleteDirectoryContents(itemPath); // 递归删除子文件夹内容
                    await fs.promises.rmdir(itemPath); // 删除子文件夹
                } else {
                    await fs.promises.unlink(itemPath); // 删除文件
                }
            }
        } catch (error) {
            throw new Error(`无法删除目录内容：${error.message}`);
        }
    }

    // 暂存文件夹名命名
    private tempPath(): string {
        const date = new Date();
        // 根据配置为暂存区命名
        switch (this.options.tempScrollingConfig.tempScrolling) {
            case TempScrolling.YEAR: return `${date.getFullYear()}`;
            case TempScrolling.MONTH: return `${date.getFullYear()}-${date.getMonth() + 1}`;
            case TempScrolling.DAY: return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        }
    }

    // 截取暂存区文件路径--并且验证路径是否存在
    private tempFilePath(file: string): string {
        // 获取暂存区时间戳文件夹名
        const dateInterval = this.options.temp && file.includes(this.interval) || new RegExp(`^${this.options.delectPath}${this.interval}`).test(file) && !this.options.temp && file.includes(this.interval) ? file.slice(0, file.indexOf(this.interval)) : "";
        // 获取暂存区时间戳内文件名
        const pathInterval = this.options.temp && dateInterval && file.includes(this.pathInterval) || file.slice(0, 1) === this.interval && file.includes(this.pathInterval) || file.includes(this.pathInterval) && new RegExp(`^${this.options.delectPath}${this.interval}`).test(file) && !this.options.temp ? file.slice(file.indexOf(this.interval) + 1, file.indexOf(this.pathInterval)).replace("-", "/") : "";
        // 查询时间戳文件夹是否存在
        if (dateInterval && !fs.existsSync(`${this.options.path}/${dateInterval}`)) {
            console.error("时间戳文件夹不存在");
            return;
        }
        // 当满足时间戳前提下验证是否满足时间戳内文件夹
        if (dateInterval && pathInterval && !fs.existsSync(`${this.options.path}/${dateInterval}/${pathInterval}`) || !dateInterval && pathInterval && !fs.existsSync(`${this.options.path}/${pathInterval}`)) {
            console.error("时间戳内文件夹不存在");
            return;
        }
        // 具有暂存性质拼接文件目录
        let path = this.options.path;
        path += dateInterval ? `/${dateInterval}` : "";
        path += pathInterval ? `/${pathInterval}` : "";
        // if (this.options.temp) {
        //     path += dateInterval ? `/${dateInterval}` : "";
        //     path += dateInterval && pathInterval ? `/${pathInterval}` : "";
        // }
        // // 特殊情况delect删除模式
        // if (new RegExp(`^${this.options.delectPath}${this.interval}`).test(file) || !this.options.temp) {
        //     path += dateInterval ? `/${dateInterval}` : "";
        //     path += dateInterval && pathInterval ? `/${pathInterval}` : "";
        // }
        // // 非具有暂存性质拼接
        // if (!this.options.temp && pathInterval && !new RegExp(`^${this.options.delectPath}${this.interval}`).test(file)) {
        //     path += `/${pathInterval}`;
        // }
        return path;
    }

    // 提取具有暂存性质的文件名，去除暂存前缀
    private tempFileName(file: string): string {
        const temp = file.includes(this.interval) ? file.slice(file.indexOf(this.interval) + 1) : file;
        const fileName = file.includes(this.interval) && file.includes(this.pathInterval) || file.slice(0, 1) === this.interval && file.includes(this.pathInterval) ? temp.slice(temp.indexOf(this.pathInterval) + 1) : temp;
        return fileName;
    }
} 