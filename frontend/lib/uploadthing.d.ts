import type { OurFileRouter } from "@/app/api/uploadthing/core";
export declare const UploadButton: <TEndpoint extends string | number | symbol>(props: Omit<Omit<import("@uploadthing/react").UseUploadthingProps<OurFileRouter, OurFileRouter>, "signal"> & {
    onUploadAborted?: (() => import("@uploadthing/shared").MaybePromise<void>) | undefined;
    endpoint: import("uploadthing/types").EndpointArg<OurFileRouter, TEndpoint>;
    url?: string | URL;
    fetch?: import("@uploadthing/shared").FetchEsque | undefined;
    config?: {
        mode?: "auto" | "manual";
        appendOnPaste?: boolean;
        cn?: import("@uploadthing/shared").ClassListMerger;
    };
    disabled?: boolean;
    onChange?: (files: File[]) => void;
} & {
    className?: string;
    appearance?: {
        container?: import("@uploadthing/shared").StyleField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
        button?: import("@uploadthing/shared").StyleField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
        allowedContent?: import("@uploadthing/shared").StyleField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
        clearBtn?: import("@uploadthing/shared").StyleField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
    };
    content?: {
        button?: import("@uploadthing/shared").ContentField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
        allowedContent?: import("@uploadthing/shared").ContentField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
        clearBtn?: import("@uploadthing/shared").ContentField<{
            __runtime: "react";
            ready: boolean;
            isUploading: boolean;
            uploadProgress: number;
            fileTypes: string[];
            files: File[];
        }>;
    };
}, keyof import("@uploadthing/react").GenerateTypedHelpersOptions>) => OurFileRouter;
export declare const UploadDropzone: <TEndpoint extends string | number | symbol>(props: Omit<import("@uploadthing/react").UploadDropzoneProps<OurFileRouter, TEndpoint>, keyof import("@uploadthing/react").GenerateTypedHelpersOptions>) => OurFileRouter;
export declare const useUploadThing: <TEndpoint extends string | number | symbol>(endpoint: import("uploadthing/types").EndpointArg<OurFileRouter, TEndpoint>, opts?: import("@uploadthing/react").UseUploadthingProps<OurFileRouter, OurFileRouter>) => {
    readonly startUpload: (files: File[], input?: any) => Promise<import("uploadthing/types").ClientUploadedFileData<OurFileRouter>[]>;
    readonly isUploading: boolean;
    readonly routeConfig: import("@uploadthing/shared").ExpandedRouteConfig | undefined;
}, uploadFiles: <TEndpoint extends string | number | symbol>(slug: import("uploadthing/types").EndpointArg<OurFileRouter, TEndpoint>, opts: Omit<{
    files: File[];
    signal?: AbortSignal | undefined;
    onUploadBegin?: ((opts: {
        file: string;
    }) => void) | undefined;
    onUploadProgress?: ((opts: {
        file: File;
        progress: number;
        loaded: number;
        delta: number;
        totalLoaded: number;
        totalProgress: number;
    }) => void) | undefined;
    skipPolling?: import("@uploadthing/shared").ErrorMessage<"This option has been moved to your serverside route config. Please use `awaitServerData` in your route config instead.">;
    url: URL;
    headers?: HeadersInit | (() => import("@uploadthing/shared").MaybePromise<HeadersInit>) | undefined;
    package: string;
}, keyof import("uploadthing/types").GenerateUploaderOptions>) => Promise<import("uploadthing/types").ClientUploadedFileData<OurFileRouter>[]>;
