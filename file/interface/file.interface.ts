import { TempScrolling } from "../enum/file.enum"

export interface FileModuleOptions {
    // 存储地址
    path: string
    // 删除存储地址
    delectPath?: string
    // 文件上传大小限制(针对bufferUpload)
    max?: number
    // 是否开启暂存区机制
    temp?: boolean
    // 滚动日期(interval年,interval月,interval日清除文件)
    tempScrollingConfig?: {
        tempScrolling: TempScrolling
        interval: number
    }
}