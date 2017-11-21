/**
 * Created by leoriccao on 2016/2/17.
 */
define(function(require, exports, module) {
    var Radio = require('common/ui/Radio'),
        Checkbox = require('common/ui/Checkbox'),
        Color = require('common/ui/Color'),
        DateTime = require('common/ui/DateTime'),
        Dialog = require('common/ui/Dialog'),
        Drop = require('common/ui/Drop'),
        DropList = require('common/ui/DropList'),
        DropPanel = require('common/ui/DropPanel'),
        ErrorTip = require('common/ui/ErrorTip'),
        Follow = require('common/ui/Follow'),
        LightTip = require('common/ui/LightTip'),
        Loading = require('common/ui/Loading'),
        Pagination = require('common/ui/Pagination'),
        Placeholder = require('common/ui/Placeholder'),
        Range = require('common/ui/Range'),
        //Scrollbar = require('common/ui/Scrollbar'),
        Select = require('common/ui/Select'),
        Tab = require('common/ui/Tab'),
        Tips = require('common/ui/Tips'),
        Validate = require('common/ui/Validate'),
        Table = require('common/comp/Table'),
        Form = require('common/comp/Form');

    /*将所有组件封装到一个组件中*/

    function ui_comp() { 
        this.Checkbox = Checkbox;
        this.Color = Color;
        this.DateTime = DateTime;
        this.Dialog = Dialog;
        this.Drop = Drop;
        this.DropList = DropList;
        this.DropPanel = DropPanel;
        this.ErrorTip = ErrorTip;
        this.Follow = Follow;
        this.LightTip = LightTip;
        this.Loading = Loading;
        this.Pagination = Pagination;
        this.Placeholder = Placeholder;
        this.Radio = Radio;
        this.Range = Range;
        //this.Scrollbar = Scrollbar;
        this.Select = Select;
        this.Tab = Tab;
        this.Tips = Tips;
        this.Validate = Validate;
        this.Table = Table;
        this.Form = Form;
    }

    module.exports = new ui_comp();
});
