// types/quill.d.ts
declare class Quill {
    constructor(selector: string | HTMLElement, options: { modules?: { toolbar: any }, theme: string , readOnly?: boolean });
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
    enable(): void;
    getSelection(): { index: number, length: number };
    root: HTMLElement;
    deleteText(index: number, length: number): void;
    insertText(index: number, text: string, format?: string): void;
    formatText(index: number, length: number, format: string, value: any): void;
    removeFormat(index: number, length: number, format: string): void;
    isEnabled(): boolean;
    history: { undo: () => void, redo: () => void };
    //clipboard: { dangerouslyPasteHTML(html: string): void, dangerouslyPastePlainText(text: string): void, convert(delta: any): void };
    update(): void;

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