/**
 * @Validate.js
 * @author xunxuzhang
 * @version
 * Created: 15-08-19
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Validate = factory();
    }
}(this, function (require) {
	if (typeof require == 'function') {
		require('common/ui/ErrorTip');
	} else if (!$().follow) {
		if (window.console) {
			console.error('need ErrorTip.js');
		}
		return {};
	}

	/**
     * 基于HTML5规范的表单验证方法
	 * 根据原生属性:type, required, min, max, minlength, maxlength, step, pattern等属性进行验证
	 * 支持new实例构造以及jQuery包装器用法，例如：
	 * new Validate(el, options);
	 * or
	 * $().validate();
	 * 很多验证规则基于其他UI组件特征
     */

    
    // 包装器方法
    $.fn.validate = function(callback, options) {
    	return $(this).each(function() {
    		$(this).data('validate', new Validate($(this), callback, options));
    	});
    };

    // 选中某范围文字内容的拓展方法
    $.fn.selectRange = function(start, end) {
    	var that = $(this).get(0);
		if (that.createTextRange) {
			var range = that.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		} else {
			that.focus();
			that.setSelectionRange(start, end);
		}
		return $(this);
    };
	
	// 是否含有某布尔属性方法
	$.fn.isProp = function(attr) {
		var prop = $(this).prop(attr) || $(this).attr(attr);
		if (prop || typeof prop == 'string') {
			return true;
		}
		return false;
	};

	// 全角转半角方法
    $.dbc2sbc = function(str) {
    	var result = '', i, code;
		for (i=0 ; i<str.length; i++) {
			code = str.charCodeAt(i);
			if (code >= 65281 && code <= 65373) {
				result += String.fromCharCode(str.charCodeAt(i) - 65248);
			} else if (code == 12288) {
				result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
			} else {
				result += str.charAt(i);
			}
		}
		return result;
    };

    // 获得并重置type
    $.getType = function(ele) {
    	// 控件的类型
		// 这里不能直接ele.type获取，否则，类似email类型直接就是text类型
		// 但是，有些元素的type是隐式的，例如textarea，因此ele.type还是需要的
		var attrType = ele.getAttribute('type');
		var type = attrType || ele.type || '';
		// 高级版本IE浏览器的向下兼容模式，会忽略email类型
		// 虽然这种情况出现的可能性很小，但是，为了万一
		// 可以使用type='email '解决此问题
		// 所以，才会有下面的正则替换，得到最精准的type类型
		type = type.toLowerCase().replace(/\W+$/, '');

		// 对于本来支持的浏览器，需要变成真实的
		if (attrType && attrType != type && $('<input type="'+ type +'">').attr("type") == type) {
			try { ele.type = type; } catch(e) { }
		}

		// 类似_date_这种干掉浏览器默认类型的处理
		return type.replace(/_/g, '');	
    }

    // 获得字符长度
    // @ele  Object   input/textarea表单控件元素
    // @max  Number   返回满足最大值时候的真实字符长度
    $.getLength = function(ele, max) {
    	if (ele.type == 'password') {
    		return max? max: ele.value.length;
    	}
    	// 语言属性和trim后的值
    	var lang = ele.getAttribute('lang'), value = $.trim(ele.value);
    	if (!lang) {
    		return max? max: value.length;
    	}
    	if (value == '') return 0; 

    	// 中文和英文计算字符个数的比例
    	var ratioCh = 1, ratioEn = 1;
		if (/zh/i.test(lang)) {
			// 1个英文半个字符
			ratioEn = 0.5;
		} else if (/en/i.test(lang)) {
			// 1个中文2个字符
			ratioCh = 2;
		}    	   	
    	
    	// 下面是中文或全角等字符正则
    	if (!max) {
    		var lenOriginCh = value.replace(/[\x00-\xff]/g, '').length, 
    			lenOriginEn = value.length - lenOriginCh;

    		// 根据比例返回最终长度
    		return Math.ceil(lenOriginEn * ratioEn) + Math.ceil(lenOriginCh * ratioCh);
    	} else {
    		var start = 0, lenMatch = max;
    		$.each(value.split(''), function(index, letter) {
    			if (start >= max) return;
    			if (/[\x00-\xff]/.test(letter)) {
    				// 如果字符是英文
    				start += ratioEn;
    			} else {
    				// 如果字符是英文
    				start += ratioCh;
    			}

    			if (start >= max) {
    				lenMatch = index + 1;
    			}
			});
			return lenMatch;
    	}    	
    };

    // 一些全局的属性和方法
    $.validate = (function() {
    	return {
    		reg: {
    			email: '^[a-z0-9._%-]+@([a-z0-9-]+\\.)+[a-z]{2,4}$',
    			number: '^\\-?\\d+(\\.\\d+)?$',
				url: "^(http|https)\\:\\/\\/[a-z0-9\\-\\.]+\\.[a-z]{2,3}(:[a-z0-9]*)?\\/?([a-z0-9\\-\\._\\:\\?\\,\\'\\/\\\\\\+&amp;%\\$#\\=~])*$",
				tel: '^1\\d{10}$',
				zipcode: '^\\d{6}$',
				date: '^\\d{4}\\-(0\\d|1[0-2])\\-([0-2]\\d|3[0-1])$',
				time: '^[0-2]\\d\\:[0-5]\\d$',
				hour: '^[0-2]\\d\\:00$',
				minute: '^[0-2]\\d\\:[0-5]\\d$',
				'date-range': '^\\d{4}(\\-\\d{2}){2}\\s至\\s\\d{4}(\\-\\d{2}){2}$',
				'month-range': '^\\d{4}\\-\\d{2}\\s至\\s\\d{4}\\-\\d{2}$'
    		},

    		prompt: function(result, ele, options) {
    			/*
				 * @result  是验证返回的结果，为纯对象
				            {
								type: '',
								error: ''
				            }
				            有对应的提示信息
				 * @ele     是当前出错的元素, 此参数可选
				            当该属性存在的时候，文字提示内容更丰富与智能
				 * @options 自定义的提示数据，优先级最高, 需要和ele参数配合使用
    			*/
    			var defaultPrompt = {
    				name: $.extend({}, {
    					email: '邮箱',
    					tel: '手机号码',
    					url: '网址',
    					zipcode: '邮编',
    					password: '密码',
    					number: '数值',
    					range: '数值',
    					date: '日期',
    					year: '年份',
    					month: '月份',
    					hour: '小时',
    					minute: '分钟',
    					time: '时间',
    					datetime: '日期时间',
    					'date-range': '日期范围',
    					'month-range': '月份范围'
    				}, $.validate.name || {}),
    				ignore: {
    					radio: '请选择一个选项',
    					checkbox: '如果要继续，请选中此框',
    					select: '请选择列表中的一项',
    					'select-one': '请选择列表中的一项',
    					empty: '请填写此字段'
	    			},
	    			unmatch: {
	    				pattern: '内容格式不符合要求',
	    				multiple: '某项内容格式不符合要求'
	    			},
	    			out: {
	    				min: '值偏小',
	    				max: '值偏大',
	    				step: '值不符合要求'
	    			},
	    			overflow: {
	    				minlength: '内容长度偏小',
	    				maxlength: '内容长度偏大'
	    			}
    			};

    			if (!result) return;

    			// 最终的提示文字

    			// 元素的id, type等
    			var text = '', id = ele.id, type = '', error = result.error;

    			if (ele) {
    				type = ele.getAttribute('type') || ele.type || '';
    				type = $.trim(type);
    				if (type == 'select-one') type = 'select';
    			}

    			// options对应的提示信息
    			options = options || {};
    			var optionsPrompt = options.prompt || options;

    			if (id && $.isArray(options)) {
    				$.each(options, function(index, obj) {
    					if (obj.id == id) {
    						optionsPrompt = obj.prompt;
    					}
    				});
    			}

    			// 错误提示关键字
    			var name = defaultPrompt.name[type] || (function() {
    				if (!options.label || !id || /checkbox|radio/.test(type)) return;
    				var text = '';
    				// 从label动态获取提示数据
    				$('label[for='+ id +']').each(function() {
    					var label = $(this).clone();
    					// 只使用裸露的文字作为提示关键字
    					label.children().remove(),
    					labelText = $.trim(label.html()).replace(/\d/g, '');
    					// 内容最长的那个元素作为提示文字
    					if (labelText.length > text.length) {
    						text = labelText;
    					}
    				});
    				// 提示关键字显然不会小于2个字
    				if (text.length >= 2) return text;    				
    			})();

    			switch (result.type) {
    				case 'ignore': {
    					// 自定义提示
    					text = optionsPrompt.ignore;
    					// 如果没有对应的自定义提示
    					if (!text) {
    						// 则使用默认的提示：
    						// 1. 根据类型关键字组装的提示
    						if (type && name) {
    							if (type != 'select') {
    								text = name + '不能为空';	
    							} else {
    								text = defaultPrompt.ignore[type] = '您尚未选择' + name;
    							}
    						} else {
    							// 2. 默认的ignore几个错误提示
    							text = defaultPrompt.ignore[error];
    						}

    						text = text || defaultPrompt.ignore.empty;
    					}

    					break;
    				}
    				case 'unmatch': {
    					// 这里的默认错误提示没有一个和type关联
    					// 因此，逻辑跟上面的是有差异的

    					// 首先，优先使用自定义提示是一样的    					
    					if (!(text = optionsPrompt.unmatch)) {
    						// 然后
    						if (type && name) {
    						 	// 1. 试试关键字提示
    						 	text = name + '格式不符合要求';
    						 } else {
    						 	// 2. 宽泛的默认提示
    						 	text = defaultPrompt.unmatch[error] || defaultPrompt.unmatch.pattern;
    						 }
    						 text = text || defaultPrompt.ignore.empty;
    					}
    					break;
    				}
    				case 'out': {
    					// 先看看有没有自定义的提示
    					text = optionsPrompt.out && optionsPrompt.out[error];

    					if (!text) {
    						// out可以是range类型, date类型，number类型
	    					if (type && name) {
	    						var min = ele.getAttribute('min'),
	    							max = ele.getAttribute('max'),
	    							step = ele.getAttribute('step') * 1 || 1;
	    						
	    						if (type == 'month-range') {
	    							min = min.slice(0,7);
	    							max = max.slice(0,7);
	    						}

	    						var textBigger = '必须要大于或等于' + min, textSmaller = '必须要小于或等于' + max;

	    						if (error == 'min') {
	    							text = name + textBigger;
	    							if (type.slice(-6) == '-range') {
	    								text = '起始日期' + textBigger;
	    							}
    							} else if (error == 'max') {
    								text = name + '必须要小于或等于' + max;
    								if (type.slice(-6) == '-range') {
	    								text = '结束日期' + textSmaller;
	    							}
    							} else if (error == 'min-max') {
    								text = '起始日期' + textBigger + '，结束日期' + textSmaller;
    							} else if (error == 'step') {
    								if (type == 'number' || type == 'range') {
	    								text = '请输入有效的值。两个最接近的有效值是' + (function() {
	    									min = min * 1;
	    									max = max * 1;
	    									var value = $.trim(ele.value) * 1, closest = min;
	    									for (var start=min; start+=step; start<max) {
	    										if (start < value && (start + step) > value) {
	    											closest = start;
	    											break;
	    										}
	    									}

	    									return [closest, closest + step].join('和');
	    								})();
    								} else {
    									text = '请选择有效的值。' + name + '间隔是' + step;
    								}
    							}
	    					} else {
	    						// 纯粹使用含糊的默认提示
	    						text = defaultPrompt.out[error];
	    					}
    					}

    					text = text || defaultPrompt.out.step;
    					break;
    				}
    				case 'overflow': {
    					// 先看看有没有自定义的提示
    					text = optionsPrompt.overflow && optionsPrompt.overflow[error];
    					if (!text) {
    						var minlength = ele.getAttribute('minlength'),
	    						maxlength = ele.maxlength || ele.getAttribute('maxlength');

	    					// 关于字符个数说明
	    					var lang = ele.getAttribute('lang'), textCharLength = '';
	    					if (/zh/i.test(lang)) {
	    						textCharLength = '个汉字(2字母=1汉字)';
	    					} else if (/en/i.test(lang)) {
	    						textCharLength = '个字符(1汉字=2字符)';
	    					}
	    						
	    					if (error == 'minlength') {
	    						text ='内容长度不能小于' + minlength + textCharLength;
	    					} else if (error == 'maxlength') {
	    						text ='内容长度不能大于' + maxlength.replace(/\D/g, '') + textCharLength;
	    					}	    					
    					}
    					text = text || defaultPrompt.overflow[error];
    					break;
    				}
    			}

    			if ($.isFunction(text)) {
    				text = text.call(ele, $(ele));
    			}

    			return text;
    		},

    		/*
			** 验证一般包括下面几个个方向：
			** 1. 是否required同时值为空
			** 2. 是否数据匹配错误(pattern, type)
			** 3. 是否超出范围(min/max/step)
			** 4. 内容超出限制(minlength, maxlength)
			** 下面的这些方法就是上面3个方向判断
			** 其中，参数ele为DOM对象
			** 返回数据规则如下：
			** 如果没有把柄，返回false;
			** 如果真的有误，则返回错误类别：{
				  type: ''
	           }
			}
    		*/

    		isIgnore: function(ele) {
    			// 主要针对required必填或必选属性的验证
    			if (!ele || ele.disabled) return false;

    			// 类型
    			var type = $.getType(ele);	

    			// 此时的值才是准确的值（浏览器可能会忽略文本框中的值，例如number类型输入框中的不合法数值）
    			var el = $(ele), value = ele.value;

    			if (el.isProp('required')) {

    				// 根据控件类型进行验证
					// 1. 单复选框比较特殊，先处理下
					if (type == 'radio') {
						// 单选框，只需验证是否必选，同一name单选组只有要一个设置required即可
						var eleRadios = self, eleForm;

						if (ele.name && (eleForm = el.parents('form')).length) {
							eleRadios = eleForm.find("input[type='radio'][name='"+ ele.name +"']");
						}

						// 如果单选框们没有一个选中，则认为无视了required属性
						var atLeastOneRadioChecked = false;
							
						eleRadios.each(function() {
							if (atLeastOneRadioChecked == false && $(this).prop("checked")) {
								atLeastOneRadioChecked = true;
							}
						});
						
						if (atLeastOneRadioChecked == false) {
							// 没有一个单选框选中
							return {
								type: 'ignore',
								error: 'radio'
							}
						}
						return false;
					} else if (type == 'checkbox') {
						// 复选框是每一个都必须选中
						if (el.prop('checked') == false) {
							return {
								type: 'ignore',
								error: 'checkbox'
							}
						}
						return false;
    				} else if (/select/.test(type) && value == '') {
    					return {
							type: 'ignore',
							error: 'select'
						}
					} else if (type != 'password') {
						value = $.trim(value);
					}

					if (value == '') {
						// 重新赋值，清空可能被浏览器默认认为不合法的值
						// 但是需要是现代浏览器，低版本IE会不断触发属性改变事件
						if (history.pushState) ele.value = '';

						// 返回验证结果
						return {
							type: 'ignore',
							error: 'empty'
						};
					}
    			}
				
				return false;	
			},
			isUnmatch: function(ele, regex, params) {
				// 禁用元素不参与验证
				if (!ele || ele.disabled) return false;

				var el = $(ele);

				// 原始值和处理值
				var inputValue = ele.value, dealValue = inputValue;

				// 类型
    			var type = $.getType(ele);	

				// 特殊控件不参与验证
				if (/^radio|checkbox|select$/i.test(type)) return false;

				// 全角半角以及前后空格的处理
				// 适用于type=url/email/tel/zipcode/number/date/time等
				if (type != 'password') {
					dealValue = $.trim(inputValue);
				}
				if (/^text|textarea|password$/i.test(type) == false) {
					dealValue = $.dbc2sbc(dealValue);
				}
				//  文本框值改变，重新赋值
				// 即时验证的时候，不赋值，否则，无法输入空格
				if ($.validate.focusable !== false && $.validate.focusable !== 0 && dealValue != inputValue) {
					ele.value = dealValue;
				}

				// 如果没有值，则认为通过，没有错误
				if (dealValue == '') return false;

				// 获取正则表达式，pattern属性获取优先，然后通过type类型匹配。注意，不处理为空的情况
				regex = regex || (function() {
					return el.attr('pattern');
				})() || (function() {
					// 文本框类型处理，可能有管道符——多类型重叠，如手机或邮箱
					return type && $.map(type.split('|'), function(typeSplit) {
						var matchRegex = $.validate.reg[typeSplit];
						if (matchRegex) return matchRegex;
					}).join('|');	
				})();
				
				// 如果没有正则匹配的表达式，就没有验证的说法，认为出错为false
				if (!regex) return false;
				
				// multiple多数据的处理
				var isMultiple = el.isProp('multiple'), newRegExp = new RegExp(regex, params || 'i');
				// number,range等类型下multiple是无效的
				if (isMultiple && /^number|range$/i.test(type) == false) {
					var isAllPass = true;
					$.each(dealValue.split(','), function(i, partValue) {
						partValue = $.trim(partValue);
						if (isAllPass && !newRegExp.test(partValue)) {
							isAllPass = false;
						}
					});
					// 有数据没有匹配
					if (isAllPass = false) {
						return {
							type: 'unmatch',
							error: 'multiple'
						}
					}
				} else if (newRegExp.test(dealValue) == false) {
					return {
						type: 'unmatch',
						error: 'pattern'
					};
				}
				return false;
			},

			isOut: function(ele) {
				// 是否数值或日期范围超出
				if (!ele || ele.disabled || /^radio|checkbox|select$/i.test(ele.type)) return false;

				var el = $(ele);

				var attrMin = el.attr('min'), attrMax = el.attr('max'), attrStep = Number($(ele).attr('step')) || 1;
				// 值
				var type = $.getType(ele), value = ele.value;

				if (type.slice(-6) != '-range') {
					if (value == '0' || Number(value) == value) {
						value = value * 1;
					}
					if (attrMin && value < attrMin) {
						return {
							type: 'out',
							error: 'min'
						}
					} else if (attrMax && value > attrMax) {
						return {
							type: 'out',
							error: 'max'
						}
					}

					// number, range类型的范围
					
					if ((type == 'number' || type == 'range') && attrStep && attrMin &&
						!/^\d+$/.test(Math.abs(value - attrMin) / attrStep)
					) {
						return {
							type: 'out',
							error: 'step'
						}
					}
					// hour, minute, time类型的范围
					if ((type == 'hour' || type == 'minute' || type == 'time') && attrMin && attrStep) {
						var minuteValue = value.split(':')[1],
							minuteMin = attrMin.split(':')[1];

						if (type == 'hour' && (minuteValue != minuteMin || (value.split(':')[0] - attrMin.split(':')[0]) % attrStep != 0)) {
							// 小时，则是分钟要一致，小时数正好step
							return {
								type: 'out',
								error: 'step'
							}
						} else if ((minuteValue - minuteMin) % attrStep !== 0) {
							return {
								type: 'out',
								error: 'step'
							}
						}
					}
				} else {
					// 时间范围
					var arrSplitValue = value.split(' '), error = [];

					// 防止month-range时候，min/max设置的是完整时间，
					// 如2017-07-07，而不是2017-07
					if (type == 'month-range') {
						attrMin = attrMin && attrMin.slice(0,7);
						attrMax = attrMax && attrMax.slice(0,7);
					}

					if (arrSplitValue.length == 3) {
						if (attrMin && arrSplitValue[0] < attrMin) {
							error.push('min');
						}
						if (attrMax && arrSplitValue[2] > attrMax) {
							error.push('max');
						}
						if (error.length) {
							return {
								type: 'out',
								error: error.join('-')
							}
						}
					}
				}
				return false;
			},

			isOverflow: function(ele) {
				// 是否内容长度溢出的判断
				if (!ele || ele.disabled || /^radio|checkbox|select$/i.test(ele.type)) return false;

				var el = $(ele);
				//  大小限制
				var attrDataMin = el.attr('minlength'), 
					attrDataMax = ele.maxlength || el.attr('maxlength')
					// 值
					, value = ele.value;
				
				if (value == '') return false;

				var length = $.getLength(ele);

				if (attrDataMin && length < attrDataMin) {
					return {
						type: 'overflow',
						error: 'minlength'
					}
				} else if (attrDataMax && (attrDataMax = attrDataMax.replace(/\D/g, '')) && length > attrDataMax) {
					return {
						type: 'overflow',
						error: 'maxlength'
					}
				} 
				return false;
			},

			isError: function(ele) {
				// 1. 元素不存在不验证
				// 2. 禁用态表单元素不参与验证
				if (!ele || ele.disabled) return false;

				// 3. 提交、重置等元素不参与验证
				var type = ele.getAttribute('type') || ele.type, tag = ele.tagName.toLowerCase();
				if (/^button|submit|reset|file|image$/.test(type) == true || tag == 'button') return false;

				return $.validate.isIgnore(ele) || $.validate.isUnmatch(ele) || $.validate.isOut(ele) || $.validate.isOverflow(ele) || false;				
			},

			isAllPass: function(el, options) {
				// el可以是独立的DOM, 也可以是form元素，也可以是jQuery序列元素
				if (!el) return true;

				el = $(el);
				if (el.is('form')) {
					el = el.find(':input');
				}

				// 遍历以及验证
				var isAllPass = true;

				el.each(function() {
					var ele = this;
					// 一些属性

					// 实现现代浏览器下利用:invalid选择器即时响应效果
					var type = ele.getAttribute('type') || ele.type,
						pattern = ele.getAttribute('pattern');			
					if (!pattern && type && (pattern = $.validate.reg[type])) {
						ele.setAttribute('pattern', pattern);
					}

					// 1. 采用单验证模式，所以，一旦发现isAllPass为false, 我们停止接下来的验证
					// 2. 禁用态的元素不验证
					// 3. 提交按钮、重置按钮等不验证
					if (isAllPass == false || ele.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

					var result = $.validate.isError(ele);
					if (result) {
						// 提示错误
						$.validate.errorTip(ele, $.validate.prompt(result, ele, options));
						isAllPass = false;
					}
				});

				return isAllPass;
			},

			// 计数效果
			count: function(el) {
				if (!el) return this;
				var ele;
				// 计数相关代码构建
				// el只能是单个包装器对象，其余的会忽略
				if (el.get) {
					ele = el.get(0);
				} else {
					ele = el;
					el = $(el);
				}

				// 标签名
				var tag = ele.tagName.toLowerCase();

				// 首先ele需要是表单元素
				if (tag != 'input' && tag != 'textarea') {
					return this;
				}

				// 获得限制大小
				var min = el.attr('minlength') || 0, 
					max = ele.maxlength || el.attr('maxlength');

				if (!min && !max) {
					return this;
				}
				// 过滤非数值字符
				max = max.replace(/\D/g, '');

				// 类名前缀
				var clPrefix = 'ui-';
				// 其他类名
				var cl = clPrefix + tag, clBox = cl + '-x', clCount = cl + '-count';

				// 存在下面3种情况
				// 1. 普通文本框需要变身
				// 2. 缺少计数label
				// 3. HTML已经完整
				var elLabel, elMin, elMax;
				if (el.hasClass(cl)) {
					// 情况1先不支持
					return this;
				} else {
					// 情况2
					// ui-input-x
					//    input
					//    div.ui-input
					// 缺少label，也就是数值元素
					if (el.parent('.' + clBox).length == 0) {
						return this;
					}

					// 元素id必须
					var id = ele.id;
					if (!id) {
						// 没有id随机id
						id = 'id' + (Math.random() + '').replace(/\D/g, '');
						ele.id = id;
					}

					elLabel = el.parent().find('.' + clCount);
					if (elLabel.length == 0) {
						// 生成并载入计数元素
						elLabel = $('<label for="'+ id +'" class="ui-'+ tag +'-count">\
				        <span>'+ min +'</span>/<span>'+ max +'</span>\
				    </label>');
						el.parent().append(elLabel);
					} else {
						elLabel.attr('for', id);
					}
					elMin = elLabel.find('span').eq(0);
					//elMax = eleLabel.find('span').eq(1);
				}

				// 目标元素
				//var target = $.validate.getTarget(el);
				// 计数，标红方法
				var fnCount = function() {
					var length = $.getLength(ele);
					elMin.html(length);
					if (length > max) {
						elMin.addClass('red');
						// 下面注释是因为不需要即时变红，只要文字提示就可以
						// 当验证组件开启即时验证之后，会标红的
						//target.addClass('error');
					} else {
						elMin.removeClass('red');
						//target.removeClass('error');
					}
				};
				// 事件
				var flagCount = 'countBind';
				if (!el.data(flagCount)) {
					if ('oninput' in document.createElement('div')) {
						el.bind('input', function() {
							fnCount();
						});
					} else {
	    				ele.attachEvent('onpropertychange', function(event) {
							if (event && event.propertyName == "value") {
								fnCount();
							}
						});
	    			}
	    			el.data(flagCount, true);
				}

    			fnCount();

				return this;
			},

			// 显示出错信息
			errorTip: function(el, content) {
				var target = $.validate.getTarget(el);
				if (target.length == 0) return this;

				var show = function() {
					target.errorTip(content, {
						onShow: function(tips) {
							// 如果tips宽度比较小，居左定位
							// 否则，使用默认的居中
							var pffsetx = 0.5 * (tips.width() - target.width());
							if (pffsetx < 0) {
								tips.css('margin-left', 0.5 * (tips.width() - target.width()));
							} else {
								tips.css('margin-left', 0);
							}

							if ($.validate.focusable === false) {
								tips.addClass('none');
							} else {
								tips.removeClass('none');
							}
						},
						onHide: function() {
							// 前提是开启了即时验证
							if (!target.parents('form').data('immediate')) return;
							// 自定义验证方法的即时验证
							var customValidate = $.validate.el.control.data('customValidate');
							var result = customValidate && customValidate($.validate.el.control);
							if ($.validate.isError($.validate.el.control.get(0)) || (typeof result == 'string' && result.length)) {
								$.validate.el.target.addClass('error');
							}
						}
					});

					// 即时验证不需要focus与选中
					if ($.validate.focusable === false || $.validate.focusable === 0) return;
					$.validate.focusable = null;

					var el = $.validate.el.control, ele = el.get(0),
						type =ele.getAttribute('type') || ele.type;

					if (!type) return;
					
					// 如果是内容超出，选中超出的文字内容
					if (content.indexOf('内容长度') != -1 && content.indexOf('大') != -1) {
						var value = el.val(), length = value.length, lang = el.attr('lang');
						// 中文和英文计算字符个数的比例
				    	var ratioCh = 1, ratioEn = 1;
						if (/zh/i.test(lang)) {
							// 1个英文半个字符
							ratioEn = 0.5;
						} else if (/en/i.test(lang)) {
							// 1个中文2个字符
							ratioCh = 2;
						}
						// 获得最大长度的索引位置
						var maxlength = ele.maxlength || el.attr('maxlength').replace(/\D/g, '');					

						if (length && maxlength) {
							el.selectRange($.getLength(ele, maxlength), length);
						}
					} else {
						el.select();
					}
					
				};

				$.validate.el = {
					control: $(el),
					target: target
				};

				// 1. 首先，确保el在屏幕内，且需要预留tips的显示的足够距离，这里使用50像素
				var rect = target.get(0).getBoundingClientRect();
				if (rect.top < 50) {
					$('html, body').animate({
						'scrollTop': $(window).scrollTop() - (50 - rect.top)
					}, 200, show);
				} else if (rect.bottom > $(window).height()) {
					$('html, body').animate({
						'scrollTop': $(window).scrollTop() + (rect.bottom - $(window).height())
					}, 200, show);
				} else {
					show();
				}

				return this;
			},

			// 获得对应展示的元素
			getTarget: function(el) {
				var ele = el;
				if (!el) return $();
				if (el.get) {
					ele = el.get(0);
				} else {
					el = $(el);
				}
				if (el.length == 0) return;

				var target = el;

				// 根据原生控件元素，确定真实的自定义控件元素
				// 这里的很多处理跟其他表单UI组件想耦合、关联
				var type = ele.getAttribute('type') || ele.type, id = ele.id, tag = ele.tagName.toLowerCase();;
				// 1. 单复选框
				if (type == 'radio') {
					target = el.parent().find('label.ui-radio[for='+ id +']');
				} else if (type == 'checkbox') {
					target = el.parent().find('label.ui-checkbox[for='+ id +']');
				// 下拉框
				} else if (type == 'select' || tag == 'select') {
					target = el.next('.ui-select');
				// range范围选择框
				} else if (type == 'range') {
					target = el.prev('.ui-range');
				} else if (type == 'hidden' || el.css('display') == 'none') {
					if (el.data('target') && el.data('target').size) {
						target = el.data('target');
					}
				} else if (type == 'textarea' || tag == 'textarea') {
					if (el.nextAll('.ui-textarea').length) {
						target = el.nextAll('.ui-textarea').eq(0);
					} else if (!document.querySelector && el.parent('.ui-textarea').length) {
						target = el.parent('.ui-textarea');
					}
				} else if (tag == 'input') {
					if (el.nextAll('.ui-input').length) {
						target = el.nextAll('.ui-input').eq(0);
					} else if (!document.querySelector && el.parent('.ui-input').length) {
						target = el.parent('.ui-input');
					}
				}
				return target;
			}
    	};
    })();

    var Validate = function(el, callback, options) {
    	// el一般指的是form元素
    	if (!el.eq) el = $();

    	callback = callback || $.noop;

    	// 干掉浏览器默认的验证
    	el.attr('novalidate', 'novalidate');

    	var defaults = {
    		multiple: true,       		// 提交时候是全部出错红色高亮，还是仅第一个，默认是全部
    		immediate: true,  			// 是否开启即时验证
    		label: false,				// 是否利用label关联元素的innerHTML作为提示关键字
    		validate: [/*{
    			id: '',
    			prompt: {
    				ignore: '',
    				unmatch: '',
    				out: {
    					min: '',
    					max: '',
    					step: ''
    				},
    				overflow: {
    					minlength: '',
    					maxlength: ''
    				}
    			},
    			method: $.noop
    		}*/],
    		onError: $.noop,
    		onSuccess: $.noop
    	};

    	var params = $.extend({}, defaults, options || {});

    	// 还原禁用的提交和关闭按钮
    	el.find(':disabled').each(function() {
			if (/^image|submit$/i.test(this.type)) {
				$(this).removeAttr('disabled');	
			}
		});

    	var self = this;
    	// 干掉默认的提交
    	el.bind("submit", function(event) {
    		event.preventDefault();

    		if (self.isAllPass() && $.isFunction(callback)) {
	    		callback.call(this);
    		}

			return false;
		});


		// 暴露的数据
		this.el = {
			form: el
		};

		this.callback = {
			error: params.onError,
			success: params.onSuccess
		};

		this.data = params.validate;

		this.boo = {
			multiple: params.multiple,
			immediate: params.immediate,
			label: params.label
		};

		// 计数效果
		this.count();
		
		return this;
    };

    Validate.prototype.count = function() {
    	// 计数效果
    	var self = this;
    	// 即时验证
    	var form = this.el.form;
    	// 遍历计数元素
    	form.find('.ui-input-x > input, .ui-textarea-x > textarea').each(function() {
    		var ele = this, el = $(this);
    		// 对maxlength进行处理
    		var maxlength = el.attr('maxlength');
    		if (maxlength) {
    			// 给maxlength设置不合法的值，阻止默认的长度限制
    			try {
    				el.attr('maxlength', '_' + maxlength + '_');
    			} catch(e) {
    				// IE7不能设置不合法的maxlength值 %>_<%
    				el.removeAttr('maxlength')[0].maxlength = maxlength;
    			}
    		}
    		$.validate.count(el);
    	});
    };

    Validate.prototype.immediate = function() {
    	var self = this;
    	// 即时验证
    	var form = this.el.form;

    	if (form.data('immediate')) return this;

    	form.find(':input').each(function() {
    		// 元素
    		var ele = this, el = $(this);
    		// type类型筛选
    		var type = ele.type, attrType = ele.getAttribute('type');
    		// 给每个控件绑定即时验证
    		if (type == 'button' || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

    		// 不同类别不同事件
    		if (type == 'radio' || type == 'checkbox') {
    			el.on('click', function() {
    				if (self.boo.immediate == false) return;
    				var isPass = self.isPass($(this));
    				if (isPass) {
    					self.isError($(this), false);
    				}
    			});
    		} else if (/select/.test(type) || /range|date|time|hour|minute|hidden/.test(attrType)) {
    			el.on('change', function() {
    				if (self.boo.immediate == false) return;
    				var isPass = self.isPass($(this));
    				if (isPass) {
    					self.isError($(this), false);
    				}
    			});
    		} else {
    			// 输入
    			el.on({
    				focus: function(event) {					
    					if (self.boo.immediate) setTimeout(function() {
    						$.validate.focusable = 0;
    						var isPass = self.isPass(el);
		    				if (isPass) {
		    					self.isError(el, false);
		    				}
    					}, 20);
    				},
    				input: function(event) {
    					if (self.boo.immediate == false) return;
    					// IE10+下有个bug
    					// focus placeholder变化时候，会触发input事件，我只能呵呵了
    					if (document.msHidden != undefined && this.value == '' && !this.lastvalue && $(this).attr('placeholder')) {
    						this.lastvalue = this.value;
    						return;
    					}

    					$.validate.focusable = false;
    					var isPass = self.isPass($(this));
	    				if (isPass) {
	    					self.isError($(this), false);
	    					if (window.errorTip) errorTip.hide();
	    				}
	    				this.lastvalue = this.value;
    				}/*,  // 有了即时验证，以及errorTip hide回调判断，不需要blur判断了，因为时机不好掌握[:\face 哭笑不得]
    				blur: function() {
    					if (!history.pushState) {
	    					setTimeout(function() {
	    						self.isError(el);
	    					}, 198); 
    					} 					
    				}*/
    			});

    			// IE7-IE8 模拟 input
    			if ('oninput' in document.createElement('div') == false) {
    				ele.attachEvent('onpropertychange',  function(event) {
						if (event && event.propertyName == "value" && self.boo.immediate) {
							$.validate.focusable = false;
							var isPass = self.isPass($(ele));
		    				if (isPass) {
		    					self.isError($(ele), false);
		    				}
		    				$.validate.focusable = true;
						}
					});
    			}
    		}
    	});

    	form.data('immediate', true);
    	return this;
    };

    Validate.prototype.isError = function(el, isError) {
    	// 是否有错
    	if (!el || !el.get || !el.length) return this;
    	var ele = el.get(0), result = isError;
    	if (typeof isError == 'undefined' && el.is(':disabled') == false) {
    		var customValidate = el.data('customValidate');
    		result = $.validate.isError(ele) || (customValidate && customValidate(el));
    	}
    		
    	var target = $.validate.getTarget(el);

    	if (result) {
    		// 出错
    		target.addClass('error');
    	} else {    		
    		if (ele.type == 'radio' && ele.name) {
    			this.el.form.find('input[type=radio][name='+ ele.name +']').each(function() {
    				$.validate.getTarget($(this)).removeClass('error');
    			});
    		} else {
    			target.removeClass('error');
    		}
    	}

    	return result;
    };

    Validate.prototype.isPass = function(el) {
    	if (!el || !el.get || !el.length) return this;
    	var ele = el.get(0), id = ele.id, label = this.boo.label;

    	// 是否使用自定义的验证和提示
    	var customValidate = {
    		label: label
    	};
    	if (id && this.data && this.data.length) {
    		$.each(this.data, function(index, obj) {
				if (obj.id == id) {
					// 最终的提示文字，是否借助label元素
					// 参数传递路径: here -> $.validate.isAllPass -> $.validate.prompt
					if (typeof obj.label != 'undefined') {
						obj.label = label;
					}
					// 自定义验证参数
					customValidate = obj;					
				}
			});
    	}

    	var isPass = $.validate.isAllPass(el, customValidate);

    	if (isPass == true && customValidate && customValidate.method) {
    		var content = customValidate.method.call(ele, el);
    		if (typeof content == 'string' && content !== '') {
    			this.errorTip(el, content);
    			isPass = false;
    		}
    		el.data('customValidate', customValidate.method);
    	}

    	this.callback[isPass? 'success': 'error'].call(this, el);

    	return isPass;
    };

    Validate.prototype.isAllPass = function() {
    	var self = this, form = this.el.form;

    	var isAllPass = true;

		$.validate.focusable = true;

		form.find(':input').each(function() {    			
			if (isAllPass == true && self.isPass($(this)) == false) {
				isAllPass = false;
			}
			if (self.boo.multiple) {
				// 一次验证多个元素，只有一个出提示，其余标红
				var input = this;
				if (!form.data('immediate')) {
					// self.data是自定义的验证数据
					$.each(self.data, function(index, obj) {
						if (obj.id == input.id && obj.method) {
							$(input).data('customValidate', obj.method);
						}
					});
				}

				self.isError($(this));
			}
		});

		// 当有过一次提交之后，开启即时验证
		if (!form.data('immediate') && self.boo.immediate) {
			self.immediate();
		}

		return isAllPass;
		
    };

    Validate.prototype.errorTip = function(el, content) {
    	$.validate.errorTip(el, content);
    	return this;
    };


    return Validate;
}));
