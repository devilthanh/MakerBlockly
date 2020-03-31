goog.provide('Blockly.Blocks.kxnblock');

goog.require('Blockly.Blocks');

Blockly.Blocks['kxnLed1'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("kxn_Led_hehe")
        .appendField(new Blockly.FieldDropdown([["13","kxn_OPTIONNAME_13"], ["2","kxn_OPTIONNAME_2"]]), "kxn_PIN_NUMBER")
        .appendField("active")
        .appendField(new Blockly.FieldDropdown([["HIGHT","kxn_OPTIONNAME_HIGH"], ["LOW","kxn_OPTIONNAME_LOW"]]), "kxn_PIN_STATE")
        .appendField(new Blockly.FieldVariable("item"), "NAME")
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190);
 this.setTooltip("Xuất chân số ra");
 this.setHelpUrl("www.hshop.vn");
  }
};