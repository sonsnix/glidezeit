declare module "*.vue" {
    import Vue from "vue";
    export default Vue;
}

declare interface Math {
    log10(x: number): number;
}