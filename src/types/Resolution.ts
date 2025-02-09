export interface Resolution {
    width: number
    height: number
}

export enum ResolutionType {
    HD = "HD",
    FHD = "FHD",
    QHD = "QHD",
    UHD = "UHD",
}

export const ResolutionHD: Resolution = { width: 1280, height: 720 }
export const ResolutionFHD: Resolution = { width: 1920, height: 1080 }
export const ResolutionQHD: Resolution = { width: 2560, height: 1440 }
export const ResolutionUHD: Resolution = { width: 3840, height: 2160 }

export const ResolutionMap = {
    [ResolutionType.HD]: ResolutionHD,
    [ResolutionType.FHD]: ResolutionFHD,
    [ResolutionType.QHD]: ResolutionQHD,
    [ResolutionType.UHD]: ResolutionUHD,
}
