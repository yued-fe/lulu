/**
 * @DropPanel.js
 * @author xinxuzhang
 * @version
 * Created: 15-07-01
 */
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.DropPanel = factory();
    }
}(this, function (require) {
	// require
	if (typeof require == 'function') {
		require('common/ui/Drop');
	} else if (!$().drop) {
		if (window.console) {
			console.error('need Drop.js');
		}
		return {};
	}

	/*
	* 下拉面板
	* @trigger 触发下拉的按钮元素
	* @options 面板数据以及下拉参数，例如：
	*｛
	*    title: '删除评论',
	*    content: '删除后，您的粉丝在文章中将无法看到该评论。',
	*    buttons: [{}, {}]
	* ｝
	 */
	
	var prefixGlobal = 'ui-', joiner = '-', prefixDropPanel = 'ui-dropanel-', SELECTED = 'selected', DISABLED = 'disabled'; 

	// 关闭SVG
	var svg = window.addEventListener? '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>': '';

	var DropPanel = function(trigger, options) {
		var defaults = {
			title: '',
			content: '',
			buttons: [{}, {}],
			width: 'auto',


			eventType: 'click',        // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏
			offsets: {
				x: 0,
				y: 0
			},
			onShow: $.noop,
			onHide: $.noop
		};

		var params = $.extend({}, defaults, options || {});

		// 面板容器		
		var target = $('<div></div>').addClass(prefixDropPanel + 'x');
		if (/\d/.test(params.width)) {
			target.width(params.width);
		}

		// 创建轻弹框面板的各个元素
		var el = {};
		// title
		el.title = $('<h5></h5>').addClass(prefixDropPanel + 'title').html(params.title);
		// close button
		el.close = $('<a></a>').attr({
			href: 'javascript:;'
		}).html(svg).addClass(prefixDropPanel + 'close').click(function() {
			drop.hide();
		});

		el.content = $('<div></div>').addClass(prefixDropPanel + 'content').html(params.content);
		// footer
		el.footer = $('<div></div>').addClass(prefixDropPanel + 'footer');
		// 按钮
		$.each(params.buttons, function(i, btn) {
			// 避免btn为null等值报错
			btn = btn || {};
			
			// 按钮的默认参数
			var type = i? (btn.type || ''): (btn.type || 'warning'), 
				value = i? (btn.value || '取消'): (btn.value || '确定'), 
				events = btn.events || {
					click: function() {
						drop.hide();
					}	
				};
			
			// 按钮的类名值
			var cl = prefixGlobal +'button';
			if (type) cl = cl + ' ' + cl + joiner + type;

			el.footer.append(el['button' + i] = 
				$('<a href="javascript:;" class="'+ cl +'">'+ value + '</a>').bind(events)
			);	
		});

		// 组装
		target.append(el.title).append(el.close).append(el.content).append(el.footer);

		// 基于drop的面板显隐效果
		trigger.drop(target, {
			eventType: params.eventType,
			offsets: params.offsets,
			onShow: params.onShow,
			onHide: params.onHide
		});

		var drop = trigger.data('drop');

		for (key in el) {
			drop.el[key] = el[key];
		}

		return drop;
	};

	return DropPanel;
}));
