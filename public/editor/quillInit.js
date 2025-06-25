const Font = Quill.import('formats/font');
Font.whitelist = [
    'sans-serif',
    'serif',
    'monospace',
    'simsun',
    'simhei',
    'kaiti',
    'fangsong',
    'yahei'
];
Quill.register(Font, true);

const customFonts = {
    'sans-serif': '无衬线',
    'serif': '衬线',
    'monospace': '等宽',
    'simsun': '宋体',
    'simhei': '黑体',
    'kaiti': '楷体',
    'fangsong': '仿宋',
    'yahei': '微软雅黑'
};
class QuillToolbarModule{
    static fullToolbarOptions = {
        container: [
            [{ 'font': Font.whitelist }, { 'size': ['small', false, 'large', 'huge'] }],  // 字体及大小
            ['bold', 'italic', 'underline', 'strike'],                         // 文本样式
            [{ 'color': [] }, { 'background': [] }],                           // 颜色选择
            [{ 'script': 'sub'}, { 'script': 'super' }],                       // 上标/下标
            [{ 'header': [ 2, 3, 4, 5, 6, false] }],                            // 标题
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],                      // 列表
            [{ 'align': [] }],                                                 // 对齐方式
            [{'indent': '-1'}, {'indent': '+1'}],                             // 缩进
            ['link', 'image', 'video'],                                        // 插入链接、图片、视频
            ['clean']
        ],
        handlers: {

        }
    };
    // static noneToolbarOptions = {
    //     container: [],
    //     handlers: {}
    // };
}

let quill = new Quill('#editor-container', {
    modules: {
        toolbar: QuillToolbarModule.fullToolbarOptions
    },
    theme: 'snow'
});
quill.disable();

function updateFontDisplay(element) {
    const value = element.getAttribute('data-value');
    if (customFonts[value]) {
        element.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = customFonts[value];
        element.appendChild(span);
    }
}
document.querySelectorAll('.ql-font .ql-picker-item').forEach(updateFontDisplay);
const defaultOption = document.querySelector('.ql-font .ql-picker-label .ql-selected');
if (defaultOption) updateFontDisplay(defaultOption.closest('.ql-picker-item'));
