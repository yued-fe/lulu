/**
 * @Form.js
 * @author xinxuzhang
 * @version
 * Created: 16-03-01
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Form = factory();
    }
}(this, function (require) {
	// require
	if (typeof require == 'function') {
		 // 轻tips
		require('common/ui/LightTip');
		// 加载
		require('common/ui/Loading');
		// 验证
		var Validate = require('common/ui/Validate');

		// 一些表单UI控件
		require('common/ui/Select');
		var Radio = require('common/ui/Radio');
		var Checkbox = require('common/ui/Checkbox');

		// 表单元素的UI实例化
		// 单复选框，占位符
		Radio.init();
		Checkbox.init();

		require('common/ui/Placeholder');
	} else if (!$().validate) {
		if (window.console) {
			console.error('need Validate.js');
		}
		return {};
	} else if (!$.lightTip) {
		if (window.console) {
			console.error('need LightTip.js');
		}
		return {};
	} else if (!$().loading) {
		if (window.console) {
			console.error('need Loading.js');
		}
		return {};
	}

	/**
     * 项目表格组件
     * @使用示例
     *  new Form($('#form'), {}, {});
     */

	var DISABLED = 'disabled';	

	// 表格
	var Form = function(elForm, optionCallback, optionValidate) {
		if (!elForm || !elForm.length) return this;
		// optionCallback可以是对象也可以直接是成功回调
		/*
			optionCallback = {
				avoidSend: $.noop,    // 验证成功之后，请求发送前的条件约束
				success: $.noop,
				error: $.noop,
				complete: $.noop
			};
		*/
		optionCallback = optionCallback || $.noop;
		if ($.isFunction(optionCallback)) {
			optionCallback = {
				success: optionCallback
			};
		}
		
		optionValidate = optionValidate || {};

		var self = this;
		// 表单元素
		var form = elForm;
		// 通过submit按钮找到找到关联的我们肉眼所见的提交按钮
		var btnSubmitReal = form.find('input[type=submit]');
		// 我们肉眼所见的按钮，进行一些状态控制
		var btnSubmit = $('label[for='+ btnSubmitReal.attr('id') +']');

		
		// 占位符
		if ($().placeholder) {
			form.find('[placeholder]').placeholder();
		}
		// 下拉框
		form.find('select').each(function() {
			// 做个判断，防止重复绑定
			if (!$(this).data('select')) {
				$(this).selectMatch();
			}
		});

		// 暴露的元素
		this.el = {
			form: elForm,
			submit: btnSubmitReal,
			button: btnSubmit
		};

		this.option = {
			callback: optionCallback,
			validate: optionValidate
		};

		// 绑定表单验证
		this.validate = new Validate(form, function() {
			// 验证成功之后
			if (!optionCallback.avoidSend || !optionCallback.avoidSend()) { 
				self.ajax();
			}
		}, optionValidate);

		return this;
	}

	Form.prototype.ajax = function() {
		// 回调
		var optionCallback = this.option.callback;
		// 元素
		var form = this.el.form,
			button = this.el.button,
			submit = this.el.submit;
			
		// 提交数据
		// 1. 菊花转起来
		button.loading();
		// 2. 提交按钮禁用
		submit.attr(DISABLED, DISABLED);
		// 3. 请求走起来
		$.ajax({
			url: form.attr('action'),
			data: form.serialize(),
			type: form.attr('method'),
			dataType: 'json',
			success: function(json) {
				if (json.error == 0) {
					// 下一步
					optionCallback.success.call(form, json);
				} else {
					$.lightTip.error(json.msg || '您的操作没有成功，你可以稍后重试。');
					// 回调
					if ($.isFunction(optionCallback.error)) {
						optionCallback.error.apply(form, json);
					}
				}
			},
			error: function() {
				$.lightTip.error('网络异常，刚才的操作没有成功，您可以稍后重试。');
				// 回调
				if ($.isFunction(optionCallback.error)) {
					optionCallback.error.apply(form, arguments);
				}
			},
			complete: function() {
				// 菊花关闭
				button.unloading();
				// 表单恢复提交
				submit.removeAttr(DISABLED);
				// 回调
				if ($.isFunction(optionCallback.complete)) {
					optionCallback.complete.apply(form, arguments);
				}
			}
		});
	};

	Form.prototype.submit = function() {		
		this.el.form.trigger('submit');
		return this;
	}

	return Form;
}));
