"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const uuid_1 = require("uuid");
const fs_1 = require("fs");
const file_enum_1 = require("./enum/file.enum");
const path_1 = require("path");
let FileService = class FileService {
    constructor(options) {
        this.options = options;
        this.interval = "@";
        this.pathInterval = "_";
        this.delectTemp = "delect";
        if (!fs.existsSync(options.path)) {
            fs.mkdirSync(options.path);
        }
        if (options.temp && !options.tempScrollingConfig) {
            options.tempScrollingConfig = { tempScrolling: file_enum_1.TempScrolling.DAY, interval: 7 };
        }
        if (!options.delectPath) {
            options.delectPath = this.delectTemp;
        }
    }
    async bufferUpload(file, rename, path) {
        if (!file) {
            return "";
        }
        let tempPath = this.options.temp ? this.tempPath() : "";
        let _path = this.options.temp ? `${this.options.path}/${tempPath}` : this.options.path;
        if (this.options.temp && !fs.existsSync(`${_path}`)) {
            fs.mkdirSync(`${_path}`);
        }
        if (path && !fs.existsSync(`${_path}/${path}`)) {
            let __path = "";
            path.split("/").forEach(data => {
                __path += data;
                if (path && !fs.existsSync(`${_path}/${__path}`)) {
                    fs.mkdirSync(`${_path}/${__path}`);
                }
                __path += "/";
            });
        }
        if (path && this.options.temp || path && !this.options.temp) {
            tempPath += this.interval + path.replace("/", "-") + this.pathInterval;
        }
        else if (!path && this.options.temp) {
            tempPath += this.interval;
        }
        if (Array.isArray(file)) {
            for (let i = 0; i < file.length; i++) {
                if (file[i].size > this.options.max) {
                    console.error("error: 文件上传大小超过限制");
                    return;
                }
                file[i].originalname = rename ? `${tempPath}${(0, uuid_1.v4)()}${file[i].originalname.match(/\.([^.]+)$/)[0]}` : tempPath + file[i].originalname;
            }
            try {
                await Promise.all(file.map(data => { return fs_1.promises.writeFile(path ? `${_path}/${path}/${data.originalname}` : `${_path}/${data.originalname}`, data.buffer); }));
                return file.map(data => {
                    return data.originalname;
                });
            }
            catch (error) {
                throw new Error(error);
            }
        }
        else {
            if (this.options.max && this.options.max < file.size) {
                console.error("error: 文件上传大小超过限制");
                return;
            }
            const originalname = rename ? `${tempPath}${(0, uuid_1.v4)()}${file.originalname.match(/\.([^.]+)$/)[0]}` : tempPath + file.originalname;
            try {
                await fs.promises.writeFile(path ? `${_path}/${path}/${originalname}` : `${_path}/${originalname}`, file.buffer);
                return originalname;
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    async streamUpload(file, rename, path) {
        if (!file.path) {
            return "";
        }
        let tempPath = this.options.temp ? this.tempPath() : "";
        let _path = this.options.temp ? `${this.options.path}/${tempPath}` : this.options.path;
        if (this.options.temp && !fs.existsSync(`${_path}`)) {
            fs.mkdirSync(`${_path}`);
        }
        if (path && !fs.existsSync(`${_path}/${path}`)) {
            let __path = "";
            path.split("/").forEach(data => {
                __path += data;
                if (path && !fs.existsSync(`${_path}/${__path}`)) {
                    fs.mkdirSync(`${_path}/${__path}`);
                }
                __path += "/";
            });
        }
        if (path && this.options.temp || path && !this.options.temp) {
            tempPath += this.interval + path.replace("/", "-") + this.pathInterval;
        }
        else if (!path && this.options.temp) {
            tempPath += this.interval;
        }
        const originalname = rename ? `${tempPath}${(0, uuid_1.v4)()}${file.originalname.match(/\.([^.]+)$/)[0]}` : tempPath + file.originalname;
        try {
            const writeStream = fs.createWriteStream(path ? `${_path}/${path}/${originalname}` : `${_path}/${originalname}`);
            const readStream = fs.createReadStream(file.path);
            readStream.pipe(writeStream);
            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => resolve(originalname));
                writeStream.on('error', () => reject());
            });
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async moveTempFile(file, movePath) {
        if (!file) {
            return "";
        }
        if (!fs.existsSync(`${this.options.path}/${movePath}`)) {
            let _path = "";
            movePath.split("/").forEach(data => {
                _path += data;
                if (!fs.existsSync(`${this.options.path}/${_path}`)) {
                    fs.mkdirSync(`${this.options.path}/${_path}`);
                }
                _path += "/";
            });
        }
        const _movePath = `${this.options.path}/${movePath}`;
        const tempPath = this.interval + movePath.replace("/", "-") + this.pathInterval;
        if (Array.isArray(file)) {
            try {
                let fileNames = [];
                await Promise.all(file.map(data => { const fileName = tempPath + this.tempFileName(data); fileNames.push(fileName); return fs_1.promises.rename(`${this.tempFilePath(data)}/${data}`, `${_movePath}/${fileName}`); }));
                return fileNames;
            }
            catch (error) {
                throw new Error(error);
            }
        }
        else {
            const filePath = `${this.tempFilePath(file)}/${file}`;
            try {
                await fs.promises.rename(filePath, `${_movePath}/${tempPath}${this.tempFileName(file)}`);
                return tempPath + this.tempFileName(file);
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    async delFile(file, path) {
        if (!file) {
            return "";
        }
        let tempPath = this.options.temp ? this.tempPath() + `${this.options.delectPath}` : "";
        let _path = this.options.temp ? `${this.options.path}/${tempPath}` : this.options.path + `/${this.options.delectPath}`;
        if (!fs.existsSync(`${_path}`)) {
            fs.mkdirSync(`${_path}`);
        }
        if (path && !fs.existsSync(`${_path}/${path}`)) {
            let __path = "";
            path.split("/").forEach(data => {
                __path += data;
                if (!fs.existsSync(`${_path}/${__path}`)) {
                    fs.mkdirSync(`${_path}/${__path}`);
                }
                __path += "/";
            });
        }
        const tempName = path ? this.interval + path.replace("/", "-") + this.pathInterval : this.interval;
        if (Array.isArray(file)) {
            try {
                let fileNames = [];
                await Promise.all(file.map(async (data) => {
                    const fileName = this.options.temp ? `${tempPath}${tempName}${this.tempFileName(data)}` : `${this.options.delectPath}${tempName}${this.tempFileName(data)}`;
                    fileNames.push(fileName);
                    return fs_1.promises.rename(`${this.tempFilePath(data)}/${data}`, path ? `${_path}/${path}/${fileName}` : `${_path}/${fileName}`);
                }));
                return fileNames;
            }
            catch (error) {
                console.error(error);
            }
        }
        else {
            const filePath = `${this.tempFilePath(file)}/${file}`;
            const fileName = this.options.temp ? `${tempPath}${tempName}${this.tempFileName(file)}` : `${this.options.delectPath}${tempName}${this.tempFileName(file)}`;
            try {
                await fs.promises.rename(filePath, path ? `${_path}/${path}/${fileName}` : `${_path}/${fileName}`);
                return fileName;
            }
            catch (error) {
                throw new Error(error);
            }
        }
    }
    async delTempFile() {
        const directoryContents = await fs.promises.readdir(this.options.path, { withFileTypes: true });
        const directories = directoryContents.filter(item => item.isDirectory()).map(item => item.name);
        if (!this.options.temp) {
            if (!directories.includes(this.options.delectPath)) {
                return true;
            }
            return await this.deleteDirectoryContents(this.options.path + `/${this.options.delectPath}`).then(() => {
                console.log("删除成功");
                return true;
            }).catch(() => {
                console.error("删除失败");
                return false;
            });
        }
        let tempPath = undefined;
        switch (this.options.tempScrollingConfig.tempScrolling) {
            case file_enum_1.TempScrolling.YEAR:
                tempPath = /^\d{4}/;
                break;
            case file_enum_1.TempScrolling.MONTH:
                tempPath = /^\d{4}-(1[0-2]|0?[1-9])/;
                break;
            case file_enum_1.TempScrolling.DAY:
                tempPath = /^\d{4}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])/;
                break;
            default: return false;
        }
        let directorys = [];
        directories.forEach(directory => {
            if (tempPath.test(directory)) {
                const temp = tempPath.exec(directory)[0];
                let today = new Date();
                switch (temp.split("-").length) {
                    case 1: parseInt(temp) <= new Date().getFullYear() - this.options.tempScrollingConfig.interval ? directorys.push(directory) : null;
                    case 2: new Date(temp) <= new Date(today.getFullYear(), today.getMonth() - this.options.tempScrollingConfig.interval, 2) ? directorys.push(directory) : null;
                    case 3: new Date(temp) <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1 - this.options.tempScrollingConfig.interval, -16) ? directorys.push(directory) : null;
                }
            }
        });
        for (let i = 0; i < directorys.length; i++) {
            await this.deleteDirectoryContents(this.options.path + `/${directorys[i]}`).then(() => {
                console.log("删除成功");
                fs.promises.rmdir(this.options.path + `/${directorys[i]}`);
                return true;
            }).catch(() => {
                console.error("删除失败");
                return false;
            });
        }
    }
    getFilePath(file) {
        if (!file) {
            return "";
        }
        return `${this.tempFilePath(file)}/${file}`;
    }
    getFileName(file) {
        if (!file) {
            return "";
        }
        return this.tempFileName(file);
    }
    async deleteDirectoryContents(directoryPath) {
        try {
            const directoryContents = await fs.promises.readdir(directoryPath, { withFileTypes: true });
            for (const item of directoryContents) {
                const itemPath = (0, path_1.join)(directoryPath, item.name);
                if (item.isDirectory()) {
                    await this.deleteDirectoryContents(itemPath);
                    await fs.promises.rmdir(itemPath);
                }
                else {
                    await fs.promises.unlink(itemPath);
                }
            }
        }
        catch (error) {
            throw new Error(`无法删除目录内容：${error.message}`);
        }
    }
    tempPath() {
        const date = new Date();
        switch (this.options.tempScrollingConfig.tempScrolling) {
            case file_enum_1.TempScrolling.YEAR: return `${date.getFullYear()}`;
            case file_enum_1.TempScrolling.MONTH: return `${date.getFullYear()}-${date.getMonth() + 1}`;
            case file_enum_1.TempScrolling.DAY: return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        }
    }
    tempFilePath(file) {
        const dateInterval = this.options.temp && file.includes(this.interval) || new RegExp(`^${this.options.delectPath}${this.interval}`).test(file) && !this.options.temp && file.includes(this.interval) ? file.slice(0, file.indexOf(this.interval)) : "";
        const pathInterval = this.options.temp && dateInterval && file.includes(this.pathInterval) || file.slice(0, 1) === this.interval && file.includes(this.pathInterval) || file.includes(this.pathInterval) && new RegExp(`^${this.options.delectPath}${this.interval}`).test(file) && !this.options.temp ? file.slice(file.indexOf(this.interval) + 1, file.indexOf(this.pathInterval)).replace("-", "/") : "";
        if (dateInterval && !fs.existsSync(`${this.options.path}/${dateInterval}`)) {
            console.error("时间戳文件夹不存在");
            return;
        }
        if (dateInterval && pathInterval && !fs.existsSync(`${this.options.path}/${dateInterval}/${pathInterval}`) || !dateInterval && pathInterval && !fs.existsSync(`${this.options.path}/${pathInterval}`)) {
            console.error("时间戳内文件夹不存在");
            return;
        }
        let path = this.options.path;
        path += dateInterval ? `/${dateInterval}` : "";
        path += pathInterval ? `/${pathInterval}` : "";
        return path;
    }
    tempFileName(file) {
        const temp = file.includes(this.interval) ? file.slice(file.indexOf(this.interval) + 1) : file;
        const fileName = file.includes(this.interval) && file.includes(this.pathInterval) || file.slice(0, 1) === this.interval && file.includes(this.pathInterval) ? temp.slice(temp.indexOf(this.pathInterval) + 1) : temp;
        return fileName;
    }
};
FileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('FILE_OPTIONS')),
    __metadata("design:paramtypes", [Object])
], FileService);
exports.FileService = FileService;
//# sourceMappingURL=file.service.js.map