$(document).ready(function() {

  // Validation for Swap form
  var validatorSwap = $('#Swap').validate({
    rules: {
      'binance-chain-token': {
        required: true
      },
      'bnb-receive': {
        required: true,
        minlength: 3
      },
      'erc-from': {
        required: true,
        minlength: 3
      },
      'swap-amount': {
        required: true,
        digits: true
      }
    },
  });
  // Validation for Issue form
  var validatorIssue = $('#Issue').validate({
    rules: {
      'erc-contact': {
        required: true,
        minlength: 3
      },
      'token-name': {
        required: true
      },
      'symbol': {
        required: true
      },
      'total-supply': {
        required: true,
        digits: true
      }
    },
  });


  $('.nav-button').click(function() {

    var form_name = $(this).closest("form").attr('id');
    var form_action = $(this).attr('data-nav');
    var act_tab_num = $('div.active'+form_name).attr('id').substring(4, 5);

    if (form_action == "next") {
      var valid = $('#'+form_name).valid(); //xxxxxxx
      if(!valid) {
        // eval('validator'+form_name).focusInvalid(); //xxxxxxxx
        return false;
      } else {
        $('#tab-'+act_tab_num+"-"+form_name).removeClass('active'+form_name);
        $('#tab-'+(parseInt(act_tab_num)+1)+"-"+form_name).addClass('active'+form_name);
      }
    } else if (form_action == "previous") {

      $('#tab-'+act_tab_num+"-"+form_name).removeClass('active'+form_name);
      $('#tab-'+(parseInt(act_tab_num)-1)+"-"+form_name).addClass('active'+form_name);
    } else if (form_action == "done") {

      $('#tab-'+act_tab_num+"-"+form_name).removeClass('active'+form_name);
      $('#tab-1'+"-"+form_name).addClass('active'+form_name);

      $(".page-form").trigger('reset');
    }
  });

  $('#binance-chain-token, #bnb-receive, #erc-from, #swap-amount, #erc-contact, #token-name, #symbol, #total-supply').change(function(){
    $("#"+$(this).attr('id') + '-text').html($(this).val());
  });

  // TAB SLIDER START
  $("#tile-1 .nav-tabs a").click(function() {
    var position = $(this).parent().position();
    var width = $(this).parent().width();
      $("#tile-1 .slider").css({"left":+ position.left,"width":width});
  });
  var actWidth = $("#tile-1 .nav-tabs").find(".active").parent("li").width();
  var actPosition = $("#tile-1 .nav-tabs .active").position();
  $("#tile-1 .slider").css({"left":+ actPosition.left,"width": actWidth});
  // TAB SLIDER END

});
