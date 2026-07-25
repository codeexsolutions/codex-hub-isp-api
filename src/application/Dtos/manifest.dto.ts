export type ManifestModel = {
    name: string;
    short_name: string;
    description: string;
    theme_color: string;
    background_color: string;
    display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
    orientation:
        | "any"
        | "natural"
        | "landscape"
        | "landscape-primary"
        | "landscape-secondary"
        | "portrait"
        | "portrait-primary"
        | "portrait-secondary";
    scope: string;
    start_url: string;
    icons: ManifestIcon[];
}

export type ManifestIcon = {
    src: string;
    sizes: string;
    type: string;
    purpose?: "any" | "maskable" | "monochrome";
}