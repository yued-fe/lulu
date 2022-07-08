// 自定义代码演示组件
class CodeRun extends HTMLElement {
    static get observedAttributes () {
        return ['title', 'open'];
    }
    constructor () {
        super();

        // 附加Shadow DOM
        this.attachShadow({
            mode: 'open'
        });
        // 获取样式
        fetch('./assets/css/code-run.css').then(response => response.text()).then(data => {
            let node = document.createElement('style');
            node.innerHTML = data;
            this.shadowRoot.appendChild(node);
        });

        // 内容构建
        var template = document.createElement('template');
        template.innerHTML = `
            <div class="heading" role="heading">
                演示：${this.title}
                <button class="toggle">收起</button>
            </div>
            <div class="main">
                <div class="operate" part="operate">
                    <div class="operate-x">
                        <slot name="operate"></slot>
                    </div>
                </div>
                <button class="dragbar">拖拽条</button>
                <div class="preview" part="preview">
                    <div class="preview-x">
                        <slot name="preview">内容渲染中...</slot>
                    </div>
                </div>
            </div>
            <details class="code" part="detail">
                <summary class="code-btn">源码</summary>
                <div class="code-x">
                    <slot name="code" class="code-slot" part="code">// 源码未提供</slot>
                </div>
            </details>
        `;

        this.shadowRoot.append(template.content);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (val) {
        return this.toggleAttribute('open', !!val);
    }

    attributeChangedCallback (name) {
        if (name == 'open') {
            this.shadowRoot.querySelector('.toggle').innerHTML = this.open ? '收起': '展开';
        }
    }

    connectedCallback () {
        this.removeAttribute('title');

        // 事件处理
        var eleToggle = this.shadowRoot.querySelector('.toggle');
        eleToggle.addEventListener('click', () => {
            this.open = !this.open;
        });
        if (!this.open) {
            eleToggle.textContent = '展开';
        }

        // 尺寸设置处理
        var eleDragbar = this.shadowRoot.querySelector('.dragbar');
        var eleOperate = this.shadowRoot.querySelector('.operate');
        var eleMain = this.shadowRoot.querySelector('.main');
        // 数据存储
        var objStore = {};

        eleDragbar.addEventListener('pointerdown', function (event) {
            event.preventDefault();

            objStore.pageX = event.pageX;
            objStore.width = eleOperate.clientWidth;
        });

        document.addEventListener('pointermove', (event) => {
            if (typeof objStore.pageX == 'number') {
                event.preventDefault();

                var numMove = event.pageX - objStore.pageX;

                eleOperate.style.setProperty('--width', (objStore.width + numMove) + 'px');
            }
        });

        document.addEventListener('pointerup', () => {
            objStore.pageX = null;
        });

        var eleSoltOperate = this.querySelector('[slot="operate"]');
        if (!eleSoltOperate) {
            eleOperate.setAttribute('hidden', '');
        }

        var eleSoltCode = this.querySelector('[slot="code"]');
        var eleDetails = this.shadowRoot.querySelector('details');
        if (!eleSoltCode) {
            eleDetails.setAttribute('hidden', '');
        } else if (eleSoltCode.hasAttribute('open')) {
            eleDetails.setAttribute('open', '');
            const attrOpen = eleSoltCode.getAttribute('open');
            if (attrOpen === 'append') {
                eleMain.append(eleDetails);
            } else if (attrOpen) {
                eleMain.prepend(eleDetails);
            }
        }
    }
}

if (!customElements.get('code-run')) {
    customElements.define('code-run', CodeRun);
}
