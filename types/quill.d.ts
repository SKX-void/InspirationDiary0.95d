// types/quill.d.ts
declare class Quill {
    constructor(selector: string, options: { modules: { toolbar: any }, theme: string });
    setContents(content: any): void;
    getContents(): { ops: any[] };
    disable(): void;
    setText(text: string): void;
    getText(): string;
    setSelection(index: number, length: number): void;
    static import(name: string, value?: any): any;
    static register(name: string, value: any): void;
    on(event: string, callback: (delta: any, oldContents: any, source: string) => void): void;

    getModule(moduleName: string): QuillToolbarModule | any;

}

type ToolbarItem =
    | string
    | Record<string, any[]>
    | Record<'script', 'sub' | 'super'>
    | Record<'header', (number | boolean)[]>;
type ToolbarConfig = ToolbarItem[];

interface QuillToolbarModule {
    setOptions(options: { container: ToolbarConfig }): void;
}