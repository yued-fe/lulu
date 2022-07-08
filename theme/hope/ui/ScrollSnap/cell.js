/**
 * @description 基于 ScrollSnap 的滑动单元格效果
 * @author zhangxinxu
 * @created  2022-07-05
 */

class uiScrollSnapCell extends HTMLElement {   
    constructor () {
        super();

        this.element = this.element || {};
    }

    create () {
        // 按钮的尺寸，布局计算的处理
        let eleButtons = this.element.buttons;
        let numWidthButton = 0;
        let numLengthButton = eleButtons.length;
        if (numLengthButton) {
            [...eleButtons].reverse().forEach((button, index) => {
                let offsetWidth = button.offsetWidth;
                button.style.setProperty('--ui-offset-width', numWidthButton);
                button.style.setProperty('--ui-offset-index', index + 1);
                // 宽度增加
                numWidthButton = numWidthButton + offsetWidth;
            });

            // 创建占据空间的元素
            let eleCell = document.createElement('ui-cell');
            eleButtons[0].insertAdjacentElement('beforebegin', eleCell);
            this.style.setProperty('--ui-cell-width', numWidthButton + 'px');
            // 暴露在外
            this.space = this.cell = eleCell;

            this.addEventListener('scroll', () => {
                this.style.setProperty('--ui-offset-percent', (this.scrollLeft / numWidthButton).toFixed(2));
            });
        }
    }

    connectedCallback () {

        // 获取按钮元素
        this.element.buttons = this.querySelectorAll(':scope > button');

        this.create();
    }
}

if (!customElements.get('ui-scroll-snap-cell')) {
    customElements.define('ui-scroll-snap-cell', uiScrollSnapCell);
}
