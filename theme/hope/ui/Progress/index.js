/**
 * @author zhangxinxu
 * @create 2022-02-09
 * @description 进度条效果的增强处理
**/

/**/(async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    class UiProgress extends HTMLProgressElement {
        static get observedAttributes () {
            return ['color', 'height', 'radius', 'width', 'value', 'label'];
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
        }

        get label () {
            return this.getAttribute('label');
        }

        set label (val) {
            this.setAttribute('label', val);
        }

        get radius () {
            let radius = this.getAttribute('radius');
            if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
                radius = radius + 'px';
            }
            return radius;
        }

        set radius (val) {
            this.setAttribute('radius', val);
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        // 进度条进度信息显示
        setLabel () {
            let label = this.label;

            if (!label && label !== '') {
                return;
            }

            this.style.setProperty('--ui-progress-offset', Math.round(this.getBoundingClientRect().width * (this.value / this.max)));
            this.style.setProperty('--ui-progress-percent', Math.round((this.value / this.max) * 100) + '%');

            if (label == 'true' || label === '') {
                this.style.setProperty('--ui-progress-label', `'${Math.round((this.value / this.max) * 100) + '%'}'`);
                
            } else {
                // 自定义语法
                this.style.setProperty('--ui-progress-label', `'${new Function(...['max', 'value'], `return \`${label}\`;`)(...[this.max, this.value])}'`);
            }

            // 模拟 label 效果
            let eleLabel = this.element.label;
            if (eleLabel) {
                // 样式同步
                eleLabel.setAttribute('style', this.getAttribute('style'));
                eleLabel.className = this.className;
                // 尺寸和偏移处理
                // 按钮的尺寸和位置
                let objBoundSelect = this.getBoundingClientRect();
                // 尺寸设置
                eleLabel.style.width = objBoundSelect.width + 'px';
                eleLabel.style.height = objBoundSelect.height + 'px';
                // 偏移对比
                let objBoundTrigger = eleLabel.getBoundingClientRect();
                let objStyleTrigger = getComputedStyle(eleLabel);
                // 目前的偏移
                let numOffsetX = objStyleTrigger.getPropertyValue('--ui-offset-x') || 0;
                let numOffsetY = objStyleTrigger.getPropertyValue('--ui-offset-y') || 0;

                // 偏移误差
                let numDistanceX = objBoundSelect.left - objBoundTrigger.left;
                let numDistanceY = objBoundSelect.top - objBoundTrigger.top;

                // 设置新的偏移值
                eleLabel.style.setProperty('--ui-offset-x', Number(numOffsetX) + numDistanceX);
                eleLabel.style.setProperty('--ui-offset-y', Number(numOffsetY) + numDistanceY);
            }
        }

        renderAttribute (name, keep) {
            if (name === 'value' || name == 'label') {
                this.setLabel();
                return;
            }
            if (typeof this[name] == 'string') {
                this.style.setProperty('--ui-progress-' + name, this[name]);
            } else if (!keep) {
                this.style.removeProperty('--ui-progress-' + name);
            }
        }

        render () {
            UiProgress.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.render(name);
        }

        constructor () {
            super();

            if (!this.element) {
                this.element = {};
            }

            this.render();

            const propValue = Object.getOwnPropertyDescriptor(HTMLProgressElement.prototype, 'value');
            Object.defineProperty(UiProgress.prototype, 'value', {
                ...propValue,
                set (value) {
                    // 赋值
                    propValue.set.call(this, value);
                    // 触发渲染
                    this.renderAttribute('value');
                }
            });

            // Safari/Firefox 不支持伪元素，创建元素代替
            if (this.hasAttribute('label') && (CSS.supports('-moz-appearance:none') || !CSS.supports('text-align-last:justify'))) {
                let eleLabel = document.createElement('label');
                if (this.id) {
                    eleLabel.setAttribute('for', this.id);
                }
                eleLabel.setAttribute('is', 'ui-progress');
                // 暴露
                this.element.label = eleLabel;
            }

            // 观察尺寸变化
            let objResizeObserver = new ResizeObserver(() => {
                this.setLabel();
            });
            // 观察文本域元素
            objResizeObserver.observe(this);
        }

        connectedCallback () {
            // 插入到页面中
            let eleLabel = this.element.label;
            if (eleLabel) {
                this.insertAdjacentElement('beforebegin', eleLabel);
                // 定位和层级
                // 是否是静态定位
                if (getComputedStyle(eleLabel).position == 'static') {
                    eleLabel.style.position = 'absolute';
                }
                // 层级高一个
                let numZIndex = getComputedStyle(this).zIndex;
                if (typeof numZIndex == 'number') {
                    eleLabel.style.zIndex = numZIndex + 1;
                }

                this.setLabel();
            }

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-progress'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-progress')) {
        customElements.define('ui-progress', UiProgress, {
            extends: 'progress'
        });
    }
/**/})();
