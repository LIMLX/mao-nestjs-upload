"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FileModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileModule = void 0;
const common_1 = require("@nestjs/common");
const file_service_1 = require("./file.service");
let FileModule = FileModule_1 = class FileModule {
    static register(options) {
        return {
            module: FileModule_1,
            providers: [
                {
                    provide: 'FILE_OPTIONS',
                    useValue: options,
                },
                file_service_1.FileService,
            ],
            exports: [file_service_1.FileService],
        };
    }
};
FileModule = FileModule_1 = __decorate([
    (0, common_1.Module)({})
], FileModule);
exports.FileModule = FileModule;
//# sourceMappingURL=file.module.js.map