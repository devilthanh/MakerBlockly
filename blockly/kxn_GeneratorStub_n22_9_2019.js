goog.provide('Blockly.Arduino.kxnblock');

goog.require('Blockly.Arduino');

// Blockly.Arduino.kxnLed1= function(block) {
//   var dropdown_kxn_pin_number = block.getFieldValue('kxn_PIN_NUMBER');
//   var dropdown_kxn_pin_state = block.getFieldValue('kxn_PIN_STATE');
//   // TODO: Assemble JavaScript into code variable.
//   Blockly.Arduino.setups_['setup_kxn_led_'+dropdown_kxn_pin_number] = 'pinMode('+dropdown_kxn_pin_number+', OUTPUT);';
//   var code = 'digitalWrite('+dropdown_pin+','+dropdown_stat+');\n'

//   // var code = '...;\n';
//   return code;
// };

Blockly.Arduino['kxnLed1']= function() {
  var dropdown_kxn_pin_number = this.getFieldValue('kxn_PIN_NUMBER');
  var dropdown_kxn_pin_state = this.getFieldValue('kxn_PIN_STATE');
  var variable_name = Blockly.Arduino.variableDB_.getName(this.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  // TODO: Assemble JavaScript into code variable.
  
  Blockly.Arduino.definitions_['define_kxnLed'+dropdown_kxn_pin_number] = '#define KXNLEDPIN_' + dropdown_kxn_pin_number +  '   '+ dropdown_kxn_pin_number + '\n';

  Blockly.Arduino.setups_['setup_kxn_led_'+dropdown_kxn_pin_number] = 'pinMode(KXNLEDPIN_'+dropdown_kxn_pin_number+', OUTPUT);';

  var code = 'digitalWriteTuam(KXNLEDPIN_'+variable_name+','+dropdown_kxn_pin_state+');\n';

  return code;
};
