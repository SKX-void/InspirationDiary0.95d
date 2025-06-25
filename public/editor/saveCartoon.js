class SaveCartoon {
    static overlay = null;
    static box = null;
    static svgIconString = `
<svg width="100" height="100" viewBox="0 0 100 100">
    <defs>
        <linearGradient id="grad">
            <stop offset="0%" stop-color="#4a90e2">
                <animate attributeName="stop-color" values="#4a90e2;#8ed1fc;#4a90e2" dur="1.5s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stop-color="#8ed1fc">
                <animate attributeName="stop-color" values="#8ed1fc;#4a90e2;#8ed1fc" dur="1.5s" repeatCount="indefinite"/>
            </stop>
        </linearGradient>
    </defs>

    <g transform="translate(50,50)">
        <rect transform="rotate(0)"   x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0s"/>
        </rect>
        <rect transform="rotate(45)"  x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.15s"/>
        </rect>
        <rect transform="rotate(90)"  x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
        </rect>
        <rect transform="rotate(135)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.45s"/>
        </rect>
        <rect transform="rotate(180)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
        </rect>
        <rect transform="rotate(225)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.75s"/>
        </rect>
        <rect transform="rotate(270)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
        </rect>
        <rect transform="rotate(315)" x="-3" y="-35" width="6" height="20" fill="url(#grad)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="1.05s"/>
        </rect>
    </g>
</svg>
`
    static saveResult = false;

    static onSaving() {
        this.saveResult = true;
        this._clear(); // 清除旧内容


        this._mask();







        // 添加文字
        const text = document.createElement('div');
        text.textContent = '保存中...';
        this.box.appendChild(text);

        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);
    }

    static onSaveSuccess() {

        if (!this.overlay || !this.box) return;
        // 设置成功样式
        Object.assign(this.box.style, {
            backgroundColor: '#e6f7ee',
            borderColor: '#b2eec7',
            borderWidth: '1px',
            borderStyle: 'solid'
        });

        // 替换内容为成功图标
        this.box.innerHTML = `
      <svg viewBox="0 0 100 100" style="width:40px;height:40px;margin:0 auto 15px;">
        <circle cx="50" cy="50" r="45" fill="#4caf50"></circle>
        <path d="M30 50l15 15 20-20" stroke="white" stroke-width="5" fill="none"/>
      </svg>
      <div>保存成功</div>
    `;

        setTimeout(() => {
            this.saveResult = false;
            this._clear()
        }, 1500);
    }

    static onSaveFailed() {
        this.saveResult = false;
        if (!this.overlay || !this.box) return;

        // 设置失败样式
        Object.assign(this.box.style, {
            backgroundColor: '#fff0f0',
            borderColor: '#fcd0d0',
            borderWidth: '1px',
            borderStyle: 'solid'
        });

        // 替换内容为失败图标
        this.box.innerHTML = `
      <svg viewBox="0 0 100 100" style="width:40px;height:40px;margin:0 auto 15px;">
        <circle cx="50" cy="50" r="45" fill="#ff4d4f"></circle>
        <path d="M30 50l20 20 20-20" stroke="white" stroke-width="5" fill="none"/>
      </svg>
      <div>保存失败</div>
    `;

        setTimeout(() => {
            this.saveResult = false;
            this._clear()
        }, 1500);
    }

    static _clear() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.remove();
        }
        this.overlay = null;
        this.box = null;
    }

    static onLoading() {
        if(!this.saveResult)this._clear();

        this._mask();




        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);
    }
    static onLoaded() {
        if (!this.overlay || !this.box || this.saveResult) return;
        this._clear();
    }



    static _mask(){
        // 创建遮罩层
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999'
        });
        // 创建内容框
        this.box = document.createElement('div');
        Object.assign(this.box.style, {
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            fontSize: '16px',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        });
        // 添加加载动画
        const spinner = document.createElement('div');
        spinner.innerHTML = this.svgIconString;
        this.box.appendChild(spinner);
    }
}