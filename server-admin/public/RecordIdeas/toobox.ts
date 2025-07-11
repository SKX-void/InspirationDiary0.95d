class ToolboxDemo {
    // 静态样式配置
    private static readonly styles = {
        anchorPoint: {
            position: 'fixed',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#4a6cf7',
            boxShadow: '0 4px 12px rgba(74, 108, 247, 0.5)',
            cursor: 'move',
            zIndex: '10000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '20px',
            userSelect: 'none'
        },
        toolbox: {
            position: 'fixed',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            zIndex: '10000',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            transition: 'all 0.3s ease',
            left: '30px',
            top: '30px'
        },
        header: {
            background: 'linear-gradient(135deg, #4a6cf7, #3a5ae0)',
            color: 'white',
            padding: '12px 15px',
            cursor: 'move',
            userSelect: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontWeight: '600',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        toggleBtn: {
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
        },
        content: {
            display: 'block',
            overflow: 'hidden'
        },
        tabsContainer: {
            display: 'flex',
            background: '#f5f7ff',
            borderBottom: '1px solid #e6e9ff',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
        },
        tab: {
            padding: '12px 15px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#555',
            flexShrink: '0',
            textAlign: 'center',
            transition: 'all 0.2s'
        },
        tabContent: {
            padding: '15px',
            display: 'none',
            height: '100%',
            overflowY: 'auto',
            maxHeight: '400px'
        },
        toolGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px'
        },
        toolBtn: {
            padding: '15px 10px',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            background: 'linear-gradient(145deg, #ffffff, #f9faff)',
            transition: 'all 0.3s',
            boxShadow: '0 3px 8px rgba(0,0,0,0.05)'
        },
        toolIcon: {
            fontSize: '28px',
            marginBottom: '10px',
            transition: 'transform 0.3s'
        },
        toolText: {
            fontSize: '13px',
            color: '#444',
            fontWeight: '500'
        }
    };

    // 修改后的实例结构
    anchorPoint: { handle: HTMLDivElement, x: number, y: number };
    toolbox: {
        handle: HTMLDivElement,
        x: number,
        y: number,
        header: {
            handle: HTMLDivElement,
            title: { handle: HTMLDivElement, content: string },
            toggleBtn: { handle: HTMLButtonElement, content: string }
        },
        content: {
            handle: HTMLDivElement,
            tabsContainer: {
                handle: HTMLDivElement,
                tabs: Record<string, {
                    handle: HTMLDivElement,
                    content: string,
                    isActive: boolean,
                    tabContent: {
                        handle: HTMLDivElement,
                        display: HTMLDivElement  // 修改：grid -> display
                    }
                }>
            }
        }
    };

    private isMinimized = false;
    private dragStartPos = { x: 0, y: 0 };

    constructor(id: string = 'floatingToolBox', title: string = '悬浮工具箱') {
        // 初始化锚定点
        this.anchorPoint = {
            handle: document.createElement('div'),
            x: 30,
            y: 30
        };
        this.applyStyle(this.anchorPoint.handle, ToolboxDemo.styles.anchorPoint);
        this.anchorPoint.handle.textContent = '⚓';
        this.anchorPoint.handle.style.display = 'none'; // 默认隐藏

        // 初始化工具箱容器
        this.toolbox = {
            handle: document.createElement('div'),
            x: 30,
            y: 30,
            header: {
                handle: document.createElement('div'),
                title: {
                    handle: document.createElement('div'),
                    content: title
                },
                toggleBtn: {
                    handle: document.createElement('button'),
                    content: '▼'
                }
            },
            content: {
                handle: document.createElement('div'),
                tabsContainer: {
                    handle: document.createElement('div'),
                    tabs: {}
                }
            }
        };

        // 设置工具箱ID
        this.toolbox.handle.id = id;

        // 应用工具箱基本样式
        this.applyStyle(this.toolbox.handle, ToolboxDemo.styles.toolbox);

        // 构建header部分
        this.applyStyle(this.toolbox.header.handle, ToolboxDemo.styles.header);

        // 构建标题
        this.toolbox.header.title.handle.textContent = title;
        this.applyStyle(this.toolbox.header.title.handle, ToolboxDemo.styles.title);

        // 构建切换按钮
        this.toolbox.header.toggleBtn.handle.textContent = '▼';
        this.applyStyle(this.toolbox.header.toggleBtn.handle, ToolboxDemo.styles.toggleBtn);

        // 组装header
        this.toolbox.header.handle.appendChild(this.toolbox.header.title.handle);
        this.toolbox.header.handle.appendChild(this.toolbox.header.toggleBtn.handle);

        // 构建内容区域
        this.applyStyle(this.toolbox.content.handle, ToolboxDemo.styles.content);

        // 构建标签容器
        this.applyStyle(this.toolbox.content.tabsContainer.handle, ToolboxDemo.styles.tabsContainer);

        // 组装内容区域
        this.toolbox.content.handle.appendChild(this.toolbox.content.tabsContainer.handle);

        // 组装工具箱
        this.toolbox.handle.appendChild(this.toolbox.header.handle);
        this.toolbox.handle.appendChild(this.toolbox.content.handle);

        // 添加到DOM
        document.body.appendChild(this.anchorPoint.handle);
        document.body.appendChild(this.toolbox.handle);

        // 初始化事件
        this.initEvents();
    }

    // 应用样式辅助方法
    private applyStyle(element: HTMLElement, styles: Record<string, string>): void {
        Object.assign(element.style, styles);
    }

    // 初始化事件监听
    private initEvents(): void {
        // 记录拖拽开始位置和距离
        let dragStartX = 0;
        let dragStartY = 0;
        let dragDistance = 0;
        const dragThreshold = 5; // 5px移动距离内视为点击

        // 工具箱header拖拽
        this.toolbox.header.handle.addEventListener('mousedown', (e) => {
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragDistance = 0;
            this.startDrag(e, this.toolbox);
        });

        // 锚定点拖拽
        this.anchorPoint.handle.addEventListener('mousedown', (e) => {
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragDistance = 0;
            this.startDrag(e, this.anchorPoint);
        });

        // 切换按钮点击事件
        this.toolbox.header.toggleBtn.handle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        // 锚定点点击展开工具箱 - 修改为mouseup事件
        this.anchorPoint.handle.addEventListener('mouseup', (e) => {
            // 只有当拖拽距离小于阈值时才展开（视为点击）
            if (dragDistance < dragThreshold && this.isMinimized) {
                this.expandFromMinimized();
            }
        });

        // 全局鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            // 更新拖拽距离
            if (this.isDragging) {
                dragDistance = Math.sqrt(
                    Math.pow(e.clientX - dragStartX, 2) +
                    Math.pow(e.clientY - dragStartY, 2)
                );
            }
            this.handleDragMove(e);
        });

        // 全局鼠标释放事件
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.currentDragTarget = null;
        });
    }

    // 当前拖拽对象
    private currentDragTarget: any = null;
    private isDragging = false;

    // 开始拖拽
    private startDrag(e: MouseEvent, target: any): void {
        this.isDragging = true;
        this.currentDragTarget = target;
        this.dragStartPos = { x: e.clientX - target.x, y: e.clientY - target.y };

        // 确保使用绝对定位
        this.currentDragTarget.handle.style.position = 'fixed';
    }

    // 处理拖拽移动
    private handleDragMove(e: MouseEvent): void {
        if (!this.isDragging || !this.currentDragTarget) return;

        // 计算新位置
        this.currentDragTarget.x = e.clientX - this.dragStartPos.x;
        this.currentDragTarget.y = e.clientY - this.dragStartPos.y;

        // 应用新位置
        this.currentDragTarget.handle.style.left = `${this.currentDragTarget.x}px`;
        this.currentDragTarget.handle.style.top = `${this.currentDragTarget.y}px`;
        this.currentDragTarget.handle.style.right = 'auto';
    }

    // 切换最小化状态
    private toggleMinimize(): void {
        if (this.isMinimized) {
            this.expandFromMinimized();
        } else {
            this.minimizeToAnchor();
        }
    }

    // 最小化到锚定点
    private minimizeToAnchor(): void {
        // 同步位置
        const rect = this.toolbox.handle.getBoundingClientRect();
        this.anchorPoint.x = rect.left;
        this.anchorPoint.y = rect.top;

        this.anchorPoint.handle.style.left = `${this.anchorPoint.x}px`;
        this.anchorPoint.handle.style.top = `${this.anchorPoint.y}px`;

        // 切换可见性
        this.toolbox.handle.style.display = 'none';
        this.anchorPoint.handle.style.display = 'flex';

        this.isMinimized = true;
    }

    // 从锚定点展开
    private expandFromMinimized(): void {
        // 同步位置
        this.toolbox.x = this.anchorPoint.x;
        this.toolbox.y = this.anchorPoint.y;

        this.toolbox.handle.style.left = `${this.toolbox.x}px`;
        this.toolbox.handle.style.top = `${this.toolbox.y}px`;
        this.toolbox.handle.style.right = 'auto';

        // 切换可见性
        this.toolbox.handle.style.display = 'block';
        this.anchorPoint.handle.style.display = 'none';

        this.isMinimized = false;
    }

    // 添加新标签页
// 添加新标签页（修改显示区域初始化）
    addTab(tabId: string, tabName: string): void {
        if (this.toolbox.content.tabsContainer.tabs[tabId]) return;

        // 创建标签元素
        const tab = document.createElement('div');
        tab.textContent = tabName;
        this.applyStyle(tab, ToolboxDemo.styles.tab);

        // 创建标签内容区域
        const tabContent = document.createElement('div');
        this.applyStyle(tabContent, ToolboxDemo.styles.tabContent);

        // 创建通用显示容器（不再限于网格布局）
        const display = document.createElement('div');
        // 默认应用网格样式，但允许外部覆盖
        this.applyStyle(display, ToolboxDemo.styles.toolGrid);
        tabContent.appendChild(display);

        // 添加到DOM
        this.toolbox.content.tabsContainer.handle.appendChild(tab);
        this.toolbox.content.handle.appendChild(tabContent);

        // 存储到结构（使用display字段）
        this.toolbox.content.tabsContainer.tabs[tabId] = {
            handle: tab,
            content: tabName,
            isActive: false,
            tabContent: {
                handle: tabContent,
                display: display  // 修改：grid -> display
            }
        };

        // 设置第一个标签为活动状态
        if (Object.keys(this.toolbox.content.tabsContainer.tabs).length === 1) {
            this.setActiveTab(tabId);
        }

        // 标签点击事件
        tab.addEventListener('click', () => {
            this.setActiveTab(tabId);
        });
    }

    // 设置活动标签页
    setActiveTab(tabId: string): void {
        if (!this.toolbox.content.tabsContainer.tabs[tabId]) return;

        // 更新所有标签状态
        Object.entries(this.toolbox.content.tabsContainer.tabs).forEach(([id, tab]) => {
            tab.isActive = id === tabId;
            tab.handle.style.background = id === tabId ? 'white' : '#f5f7ff';
            tab.handle.style.color = id === tabId ? '#4a6cf7' : '#555';
            tab.tabContent.handle.style.display = id === tabId ? 'block' : 'none';
        });
    }

    // 新增：绑定自定义显示元素
    bindDisplay(
        tabId: string,
        element: HTMLElement,
        options: { 
            clearBeforeAppend?: boolean, 
            applyDefaultGrid?: boolean 
        } = {}
    ): void {
        const tab = this.toolbox.content.tabsContainer.tabs[tabId];
        if (!tab) return;

        // 清空现有内容（可选）
        if (options.clearBeforeAppend) {
            while (tab.tabContent.display.firstChild) {
                tab.tabContent.display.removeChild(tab.tabContent.display.firstChild);
            }
        }

        // 应用默认网格样式（可选）
        if (options.applyDefaultGrid) {
            this.applyStyle(tab.tabContent.display, ToolboxDemo.styles.toolGrid);
        } else {
            // 重置为通用块元素
            tab.tabContent.display.style.display = 'block';
            tab.tabContent.display.style.gridTemplateColumns = '';
            tab.tabContent.display.style.gap = '';
        }

        // 添加自定义元素
        tab.tabContent.display.appendChild(element);
    }

    // 修改后的添加按钮方法（基于bindDisplay实现）
    addButton(
        tabId: string,
        config: { icon: string; text: string; styles?: Record<string, string> },
        handler: () => void
    ): void {
        const btn = document.createElement('div');
        
        // 应用基础按钮样式
        this.applyStyle(btn, ToolboxDemo.styles.toolBtn);
        
        // 应用自定义样式（如果有）
        if (config.styles) {
            this.applyStyle(btn, config.styles);
        }

        // 添加图标
        if (config.icon) {
            const icon = document.createElement('div');
            icon.textContent = config.icon;
            this.applyStyle(icon, ToolboxDemo.styles.toolIcon);
            btn.appendChild(icon);
        }

        // 添加文本
        if (config.text) {
            const text = document.createElement('div');
            text.textContent = config.text;
            this.applyStyle(text, ToolboxDemo.styles.toolText);
            btn.appendChild(text);
        }

        // 悬停效果
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-3px)';
            btn.style.boxShadow = '0 5px 15px rgba(74, 108, 247, 0.2)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'none';
            btn.style.boxShadow = '0 3px 8px rgba(0,0,0,0.05)';
        });

        // 点击事件
        btn.addEventListener('click', handler);

        // 使用bindDisplay添加按钮
        this.bindDisplay(tabId, btn, {
            applyDefaultGrid: true  // 保持网格布局
        });
    }
    // 移除工具箱
    remove(): void {
        this.toolbox.handle.remove();
        this.anchorPoint.handle.remove();
    }

  // 修改默认工具箱创建方法
    static createDefault(): ToolboxDemo {
        const toolbox = new ToolboxDemo();

        toolbox.addTab('tools', '工具');
        toolbox.addTab('settings', '设置');
        toolbox.addTab('help', '帮助');

        // 使用新的addButton添加工具
        toolbox.addButton('tools', { 
            icon: '📋', 
            text: '剪贴板',
            styles: { background: 'linear-gradient(145deg, #ff9a9e, #fad0c4)' } // 自定义样式
        }, () => alert('剪贴板工具'));
        
        // 示例：使用bindDisplay添加自定义元素
        const customElement = document.createElement('div');
        customElement.innerHTML = `<h3>自定义组件</h3><p>完全自由的内容区域</p>`;
        customElement.style.padding = '15px';
        customElement.style.background = '#f0f9ff';
        customElement.style.borderRadius = '8px';
        
        toolbox.bindDisplay('settings', customElement, {
            clearBeforeAppend: true,
            applyDefaultGrid: false // 不使用网格布局
        });
        toolbox.addTab('tools', '工具');
        toolbox.addTab('settings', '设置');
        toolbox.addTab('help', '帮助');

        // 添加工具
        toolbox.addButton('tools', { icon: '📋', text: '剪贴板' }, () => alert('剪贴板工具'));
        toolbox.addButton('tools', { icon: '🖼️', text: '图片' }, () => alert('图片工具'));
        toolbox.addButton('tools', { icon: '📊', text: '数据' }, () => alert('数据分析'));
        toolbox.addButton('tools', { icon: '📝', text: '笔记' }, () => alert('笔记功能'));
        toolbox.addButton('tools', { icon: '⏱️', text: '计时' }, () => alert('计时器'));
        toolbox.addButton('tools', { icon: '🌐', text: '网络' }, () => alert('网络工具'));

        // 添加设置
        toolbox.addButton('settings', { icon: '🎨', text: '主题' }, () => alert('主题设置'));
        toolbox.addButton('settings', { icon: '🔔', text: '通知' }, () => alert('通知设置'));
        toolbox.addButton('settings', { icon: '🔒', text: '隐私' }, () => alert('隐私设置'));

        // 添加帮助
        toolbox.addButton('help', { icon: '❓', text: '帮助' }, () => alert('帮助中心'));
        toolbox.addButton('help', { icon: '📚', text: '文档' }, () => alert('查看文档'));
        toolbox.addButton('help', { icon: '💬', text: '支持' }, () => alert('联系支持'));

        return toolbox;
    }
}